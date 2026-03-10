{
  description = "CLI tool for interacting with Mattermost servers";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = system: nixpkgs.legacyPackages.${system};
    in
    let
      mkMm =
        pkgs:
        pkgs.stdenv.mkDerivation {
          pname = "mm";
          version = (builtins.fromJSON (builtins.readFile ./package.json)).version;
          src = ./.;

          nativeBuildInputs = [
            pkgs.bun
            pkgs.makeWrapper
          ];

          dontStrip = true;
          dontFixup = true;

          buildPhase = ''
            runHook preBuild
            export HOME=$TMPDIR
            bun install --frozen-lockfile
            bun build --compile bin/mm.ts --outfile mm
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            install -Dm755 mm $out/bin/mm
            runHook postInstall
          '';
        };
    in
    {
      packages = forAllSystems (system: {
        mm = mkMm (pkgsFor system);
        default = self.packages.${system}.mm;
      });

      overlays.default = final: prev: {
        mm = mkMm final;
      };
    };
}
