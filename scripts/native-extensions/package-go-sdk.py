#!/usr/bin/env python3
"""Package the standalone SDK's public source without local state or build output."""

import argparse
import hashlib
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("dist/vessel-extension-go-sdk-dev.tar.gz"))
    args = parser.parse_args()
    repository = Path(__file__).resolve().parents[2]
    sdk = repository / "sdk/go"
    output = args.out.resolve()
    if output == sdk or sdk in output.parents:
        parser.error("output must be outside SDK sources")
    if output.exists() or output.is_symlink():
        parser.error("output already exists; choose a new artifact path")
    subprocess.run(["go", "build", "-mod=readonly", "./..."], cwd=sdk,
                   env={**os.environ, "GOWORK": "off"}, check=True)
    sources = sorted(p for p in sdk.rglob("*") if p.is_file() and not p.is_symlink()
                     and not any(part.startswith(".") for part in p.relative_to(sdk).parts)
                     and (p.suffix in {".go", ".proto"} or p.name in {
                         "go.mod", "go.sum", "README.md", "LICENSE", "generate.sh"}))
    output.parent.mkdir(parents=True, exist_ok=True)
    # Build the complete archive before installing it; an existing artifact is
    # never overwritten, including if another packaging process finishes first.
    with tempfile.TemporaryDirectory(prefix="vessel-sdk-", dir=output.parent) as temporary:
        candidate = Path(temporary) / "sdk.tar.gz"
        with tarfile.open(candidate, "w:gz") as archive:
            for source in sources:
                archive.add(source, arcname=Path("vessel-extension-go-sdk") / source.relative_to(sdk), recursive=False)
        os.link(candidate, output)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"{digest}  {output.name}")


if __name__ == "__main__":
    main()
