import pkg from "../../../package.json";

export default function VersionLabel() {
  return (
    <span className="versionLabel">v{pkg.version}</span>
  );
}
