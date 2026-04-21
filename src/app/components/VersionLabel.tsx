import pkg from "../../../package.json";

export default function VersionLabel() {
  return (
    <span className="versionLabel" data-demo="version">v{pkg.version}</span>
  );
}
