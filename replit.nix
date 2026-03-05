# Replit Nix - Node.js for server/
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.npm
  ];
}
