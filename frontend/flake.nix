{
  description = "trainfriends server";
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };
  outputs =
    inputs@{
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachSystem
      [
        "x86_64-linux"
        "x86_64-darwin"
      ]
      (
        system:
        let
          overlays = [ ];
          pkgs = import nixpkgs {
            inherit system overlays;
            config = {
              android_sdk.accept_license = true;
              allowUnfree = true;
            };
          };

          # android = pkgs.androidenv.composeAndroidPackages {
          #   platformVersions = [ "34" ];
          #   buildToolsVersions = [ "34.0.0" ];
          #   abiVersions = [
          #     "arm64-v8a"
          #     "x86_64"
          #   ];
          # };
          # androidSdk = android.androidsdk;
          androidComp = (
            pkgs.androidenv.composeAndroidPackages {
              cmdLineToolsVersion = "8.0";
              includeNDK = true;
              # we need some platforms
              platformVersions = [
                "30"
                "35"
              ];
              # we need an emulator
              includeEmulator = true;
              includeSystemImages = true;
              systemImageTypes = [
                "default"
                "google_apis"
              ];
              abiVersions = [
                "x86"
                "x86_64"
                "armeabi-v7a"
                "arm64-v8a"
              ];
              cmakeVersions = [ "3.10.2" ];
            }
          );
          android-sdk = (pkgs.android-studio.withSdk androidComp.androidsdk);
        in
        {
          devShells.default = pkgs.mkShell {
            # ANDROID_HOME = "${androidComp.androidsdk}/libexec/android-sdk";
            # ANDROID_SDK_ROOT = "${androidComp.androidsdk}/libexec/android-sdk";
            # ANDROID_NDK_ROOT = "${androidComp.androidsdk}/libexec/android-sdk/ndk-bundle";
            # buildInputs = with pkgs; [
            #   android-sdk
            #   # androidSdk
            #   jdk23
            # ];
            buildInputs = with pkgs; [ openapi-generator-cli ];
          };

        }
      );
}
