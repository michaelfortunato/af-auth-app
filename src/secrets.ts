import fs from "fs";
import path from "path";

const secretFolderPath = process.env.SECRET_FOLDER_PATH as string;

const accessTokenPrivateKeyDir = path.join(
  secretFolderPath,
  "access-token-private-keys"
);
const accessTokenPublicKeyDir = path.join(
  secretFolderPath,
  "access-token-public-keys"
);

const refreshTokenPrivateKeyDir = path.join(
  secretFolderPath,
  "refresh-token-private-keys"
);

const refreshTokenPublicKeyDir = path.join(
  secretFolderPath,
  "refresh-token-public-keys"
);

const accessTokenPrivateKeys = fs
  .readdirSync(accessTokenPrivateKeyDir)
  .filter(file => file.split(".").pop() === "pem")
  .map(file =>
    fs.readFileSync(path.join(accessTokenPrivateKeyDir, file), "utf-8")
  );
const accessTokenPublicKeys = fs
  .readdirSync(accessTokenPublicKeyDir)
  .filter(file => file.split(".").pop() === "pub")
  .map(file =>
    fs.readFileSync(path.join(accessTokenPublicKeyDir, file), "utf-8")
  );

const refreshTokenPrivateKeys = fs
  .readdirSync(refreshTokenPrivateKeyDir)
  .filter(file => file.split(".").pop() === "pem")
  .map(file =>
    fs.readFileSync(path.join(refreshTokenPrivateKeyDir, file), "utf-8")
  );
const refreshTokenPublicKeys = fs
  .readdirSync(refreshTokenPublicKeyDir)
  .filter(file => file.split(".").pop() === "pub")
  .map(file =>
    fs.readFileSync(path.join(refreshTokenPublicKeyDir, file), "utf-8")
  );

if (
  accessTokenPrivateKeys.length === 0 ||
  refreshTokenPrivateKeys.length === 0
) {
  throw new Error("Could not initialize auth service");
} else {
  console.log("Initialized auth service! 🔥");
}

// Get database credentials

const MONGO_CLUSTER_ENDPOINT = fs.readFileSync(
  path.join(
    secretFolderPath,
    "mongo-secrets",
    "meta-data__mongo-cluster-endpoint.txt"
  ),
  { encoding: "utf-8" }
);
const MONGO_PORT = fs.readFileSync(
  path.join(
    secretFolderPath,
    "mongo-secrets",
    "meta-data__mongo-cluster-port.txt"
  ),
  { encoding: "utf-8" }
);
const MONGO_USERNAME = fs.readFileSync(
  path.join(
    secretFolderPath,
    "mongo-secrets",
    "users__auth-app__databases__authDB__username.txt"
  ),
  { encoding: "utf-8" }
);

const MONGO_PASSWORD = fs.readFileSync(
  path.join(
    secretFolderPath,
    "mongo-secrets",
    "users__auth-app__databases__authDB__password.txt"
  ),
  { encoding: "utf-8" }
);

const MONGO_AUTH_DB = "authDB";
const REPLICA_SET = fs.readFileSync(
  path.join(
    secretFolderPath,
    "mongo-secrets",
    "meta-data__mongo-replica-set.txt"
  ),
  { encoding: "utf-8" }
);
const REPLICA_SET_QUERY_PARAMETER =
  REPLICA_SET !== "" ? `&replicaSet=${REPLICA_SET}` : "";

const { AUTH_APP_SERVICE_SERVICE_PORT } = process.env;

export {
  accessTokenPrivateKeys,
  accessTokenPublicKeys,
  refreshTokenPrivateKeys,
  refreshTokenPublicKeys,
  MONGO_CLUSTER_ENDPOINT,
  MONGO_PORT,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_AUTH_DB,
  REPLICA_SET_QUERY_PARAMETER,
  AUTH_APP_SERVICE_SERVICE_PORT
};
