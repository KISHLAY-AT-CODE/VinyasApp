const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin: withApkInstaller
 * 
 * Injects native Android configuration required for APK self-update:
 * 1. REQUEST_INSTALL_PACKAGES permission in AndroidManifest.xml
 * 2. FileProvider declaration for sharing APK files with the system installer
 * 3. file_paths.xml resource for FileProvider path configuration
 * 4. ApkInstallerModule.kt — native module to trigger APK installation
 * 5. ApkInstallerPackage.kt — registers the native module
 * 6. Modifies MainApplication to register the package
 */

function withApkInstallerPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    // Add REQUEST_INSTALL_PACKAGES permission
    const permissions = manifest['uses-permission'] || [];
    const hasInstallPermission = permissions.some(
      (p) => p.$?.['android:name'] === 'android.permission.REQUEST_INSTALL_PACKAGES'
    );
    if (!hasInstallPermission) {
      permissions.push({
        $: { 'android:name': 'android.permission.REQUEST_INSTALL_PACKAGES' },
      });
    }
    manifest['uses-permission'] = permissions;

    // Add FileProvider inside <application>
    const application = manifest.application?.[0];
    if (application) {
      const providers = application.provider || [];
      const hasFileProvider = providers.some(
        (p) => p.$?.['android:name'] === 'androidx.core.content.FileProvider'
      );
      if (!hasFileProvider) {
        providers.push({
          $: {
            'android:name': 'androidx.core.content.FileProvider',
            'android:authorities': '${applicationId}.fileprovider',
            'android:exported': 'false',
            'android:grantUriPermissions': 'true',
          },
          'meta-data': [
            {
              $: {
                'android:name': 'android.support.FILE_PROVIDER_PATHS',
                'android:resource': '@xml/apk_installer_file_paths',
              },
            },
          ],
        });
      }
      application.provider = providers;
    }

    return config;
  });
}

function withApkInstallerFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, 'android');

      // 1. Create file_paths.xml
      const xmlDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      const filePathsXml = `<?xml version="1.0" encoding="utf-8"?>
<paths>
    <cache-path name="apk_updates" path="apk_updates/" />
</paths>
`;
      fs.writeFileSync(path.join(xmlDir, 'apk_installer_file_paths.xml'), filePathsXml, 'utf-8');

      // 2. Determine the package directory
      const packageName = config.android?.package || 'com.anonymous.VinyasApp';
      const packagePath = packageName.replace(/\./g, '/');
      const javaDir = path.join(androidDir, 'app', 'src', 'main', 'java', packagePath);
      fs.mkdirSync(javaDir, { recursive: true });

      // 3. Create ApkInstallerModule.kt
      const moduleKt = `package ${packageName}

import android.content.Intent
import android.os.Build
import android.net.Uri
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.io.File

class ApkInstallerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ApkInstaller"

    @ReactMethod
    fun installApk(filePath: String, promise: Promise) {
        try {
            val context = reactApplicationContext
            val file = File(filePath)

            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "APK file not found at: $filePath")
                return
            }

            val intent = Intent(Intent.ACTION_VIEW)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val authority = context.packageName + ".fileprovider"
                val uri = FileProvider.getUriForFile(context, authority, file)
                intent.setDataAndType(uri, "application/vnd.android.package-archive")
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } else {
                intent.setDataAndType(Uri.fromFile(file), "application/vnd.android.package-archive")
            }

            context.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INSTALL_ERROR", "Failed to launch APK installer: \${e.message}", e)
        }
    }
}
`;
      fs.writeFileSync(path.join(javaDir, 'ApkInstallerModule.kt'), moduleKt, 'utf-8');

      // 4. Create ApkInstallerPackage.kt
      const packageKt = `package ${packageName}

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ApkInstallerPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(ApkInstallerModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;
      fs.writeFileSync(path.join(javaDir, 'ApkInstallerPackage.kt'), packageKt, 'utf-8');

      // 5. Register ApkInstallerPackage in MainApplication
      const mainAppPath = path.join(javaDir, 'MainApplication.kt');
      if (fs.existsSync(mainAppPath)) {
        let mainAppContent = fs.readFileSync(mainAppPath, 'utf-8');

        // Only add if not already present
        if (!mainAppContent.includes('ApkInstallerPackage')) {
          // Add to the getPackages() method
          // Look for the pattern: packages.add(...) or override fun getPackages()
          // Expo's generated MainApplication uses PackageList, so we add after it
          mainAppContent = mainAppContent.replace(
            /override fun getPackages\(\): List<ReactPackage> \{([\s\S]*?)(return packages)/,
            (match, middle, returnStmt) => {
              if (middle.includes('ApkInstallerPackage')) return match;
              return `override fun getPackages(): List<ReactPackage> {${middle}packages.add(ApkInstallerPackage())\n            ${returnStmt}`;
            }
          );

          // Alternative: if using the older PackageList pattern
          if (!mainAppContent.includes('ApkInstallerPackage')) {
            mainAppContent = mainAppContent.replace(
              /(val packages = PackageList\(this\)\.packages)/,
              '$1\n            packages.add(ApkInstallerPackage())'
            );
          }

          // Final fallback: simple mutableListOf pattern
          if (!mainAppContent.includes('ApkInstallerPackage')) {
            mainAppContent = mainAppContent.replace(
              /(PackageList\(this\)\.packages\.apply \{)/,
              '$1\n              add(ApkInstallerPackage())'
            );
          }

          fs.writeFileSync(mainAppPath, mainAppContent, 'utf-8');
        }
      }

      return config;
    },
  ]);
}

module.exports = function withApkInstaller(config) {
  config = withApkInstallerPermission(config);
  config = withApkInstallerFiles(config);
  return config;
};
