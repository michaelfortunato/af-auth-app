import fs from "fs";
import path from "path";
import YAML from "yaml";

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

const clusterMetaData = YAML.parse(
  fs.readFileSync(
    path.join(secretFolderPath, "mongo-secrets", "meta-data.yaml"),
    { encoding: "utf-8" }
  )
);
const { clusterEndpoint, clusterPort, replicasetName } = clusterMetaData;

const databaseCredentials = YAML.parse(
  fs.readFileSync(
    path.join(secretFolderPath, "mongo-secrets", "authAppCredentials.yaml"),
    { encoding: "utf-8" }
  )
) as {
  username: string;
  password: string;
  databases: { databaseName: string; databaseRole: string }[];
};

const {
  username: MONGO_USERNAME,
  password: MONGO_PASSWORD,
  databases
} = databaseCredentials;

const { databaseName: MONGO_AUTH_DB } = databases.filter(
  ({ databaseName }: { databaseName: string; databaseRole: string }) =>
    databaseName === "authDB"
)[0];

const { databaseName: MONGO_ACCOUNTS_DB } = databases.filter(
  ({ databaseName }: { databaseName: string; databaseRole: string }) =>
    databaseName === "accountDB"
)[0];

const REPLICA_SET_QUERY_PARAMETER =
  replicasetName !== "" ? `&replicaSet=${replicasetName}` : "";

const { AUTH_APP_SERVICE_SERVICE_PORT } = process.env;

export {
  accessTokenPrivateKeys,
  accessTokenPublicKeys,
  refreshTokenPrivateKeys,
  refreshTokenPublicKeys,
  clusterEndpoint as MONGO_CLUSTER_ENDPOINT,
  clusterPort as MONGO_PORT,
  REPLICA_SET_QUERY_PARAMETER,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_AUTH_DB,
  MONGO_ACCOUNTS_DB,
  AUTH_APP_SERVICE_SERVICE_PORT
};