{
  description = "CLI tool for interacting with Mattermost servers";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    bun2nix = {
      url = "github:nix-community/bun2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      bun2nix,
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

      mkMm =
        system: pkgs:
        let
          b2n = bun2nix.packages.${system}.default;
        in
        b2n.mkDerivation {
          packageJson = ./package.json;
          src = ./.;
          bunDeps = b2n.fetchBunDeps { bunNix = ./bun.nix; };
          pname = "mm";
          module = "bin/mm.ts";
          bunCompileToBytecode = false;
        };
    in
    {
      packages = forAllSystems (system: {
        mm = mkMm system (pkgsFor system);
        default = mkMm system (pkgsFor system);
      });

      overlays.default = final: prev: {
        mm = mkMm final.stdenv.hostPlatform.system final;
      };
    };
}
