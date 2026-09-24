from pathlib import Path
import yaml


# createk8ssecrets.py is inside majorworking_services/
# .env.docker and k8s/ are inside majorworking_services/microservices/
BASE_DIR = Path(__file__).resolve().parent / "microservices"

ENV_FILE = BASE_DIR / ".env.docker"
OUTPUT_FILE = BASE_DIR / "k8s" / "02-secrets.yaml"


def read_env_file(path: Path) -> dict:
    variables = {}

    for line_number, raw_line in enumerate(
        path.read_text(encoding="utf-8").splitlines(),
        start=1,
    ):
        line = raw_line.strip()

        # Ignore blank lines and comments
        if not line or line.startswith("#"):
            continue

        # Handle optional "export KEY=value"
        if line.startswith("export "):
            line = line[7:].strip()

        if "=" not in line:
            print(f"Skipping invalid line {line_number}: {raw_line}")
            continue

        key, value = line.split("=", 1)

        key = key.strip()
        value = value.strip()

        # Remove surrounding quotes if present
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]

        if key:
            variables[key] = value

    return variables


def main():
    if not ENV_FILE.exists():
        raise FileNotFoundError(f".env.docker file not found: {ENV_FILE}")

    variables = read_env_file(ENV_FILE)

    if not variables:
        raise ValueError("No variables found in .env.docker")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    kubernetes_secret = {
        "apiVersion": "v1",
        "kind": "Secret",
        "metadata": {
            "name": "shopsphere-secrets",
            "namespace": "shopsphere",
        },
        "type": "Opaque",
        "stringData": variables,
    }

    with OUTPUT_FILE.open("w", encoding="utf-8", newline="\n") as f:
        yaml.safe_dump(
            kubernetes_secret,
            f,
            default_flow_style=False,
            sort_keys=False,
            allow_unicode=True,
        )

    print(f"Generated: {OUTPUT_FILE}")
    print(f"Variables: {len(variables)}")


if __name__ == "__main__":
    main()


# from pathlib import Path
# import yaml


# BASE_DIR = Path(r"C:\Users\Administrator\Desktop\Python-practice\shopshere-microservices-\microservices")

# ENV_FILE = BASE_DIR / ".env"
# OUTPUT_FILE = BASE_DIR / "k8s" / "02-secrets.yaml"


# def read_env_file(path: Path) -> dict:
#     variables = {}

#     for line_number, raw_line in enumerate(
#         path.read_text(encoding="utf-8").splitlines(),
#         start=1,
#     ):
#         line = raw_line.strip()

#         # Ignore blank lines and comments
#         if not line or line.startswith("#"):
#             continue

#         # Handle optional "export KEY=value"
#         if line.startswith("export "):
#             line = line[7:].strip()

#         if "=" not in line:
#             print(f"Skipping invalid line {line_number}: {raw_line}")
#             continue

#         key, value = line.split("=", 1)

#         key = key.strip()
#         value = value.strip()

#         # Remove surrounding quotes if present
#         if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
#             value = value[1:-1]

#         if key:
#             variables[key] = value

#     return variables


# def main():
#     if not ENV_FILE.exists():
#         raise FileNotFoundError(f".env file not found: {ENV_FILE}")

#     variables = read_env_file(ENV_FILE)

#     if not variables:
#         raise ValueError("No variables found in .env")

#     OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

#     kubernetes_secret = {
#         "apiVersion": "v1",
#         "kind": "Secret",
#         "metadata": {
#             "name": "shopsphere-secrets",
#             "namespace": "shopsphere",
#         },
#         "type": "Opaque",
#         "stringData": variables,
#     }

#     with OUTPUT_FILE.open("w", encoding="utf-8", newline="\n") as f:
#         yaml.safe_dump(
#             kubernetes_secret,
#             f,
#             default_flow_style=False,
#             sort_keys=False,
#             allow_unicode=True,
#         )

#     print(f"Generated: {OUTPUT_FILE}")
#     print(f"Variables: {len(variables)}")


# if __name__ == "__main__":
#     main()