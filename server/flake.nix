{
  description = "anki-decks";
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
          pkgs = import nixpkgs { inherit system overlays; };
        in
        {
          devShell = pkgs.mkShell {
            nativeBuildInputs = with pkgs; [
              (python3.withPackages (
                ps: with ps; [
                  fastapi
                  uvicorn
                  firebase-admin
                ]
              ))
            ];
          };
        }
      );
}
