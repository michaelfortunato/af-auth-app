import fs from "fs";
import path from "path";
import YAML from "yaml";

console.log(process.env.DEV_STAGE);

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

const clusterEndpoint = fs.readFileSync(
  path.join(secretFolderPath, "mongo-secrets", "cluster-endpoint"),
  { encoding: "utf-8" }
);

const clusterPort = fs.readFileSync(
  path.join(secretFolderPath, "mongo-secrets", "cluster-port"),
  { encoding: "utf-8" }
);

const replicasetName = fs.readFileSync(
  path.join(secretFolderPath, "mongo-secrets", "replicaset-name"),
  { encoding: "utf-8" }
);

const databaseCredentials = YAML.parse(
  process.env.DEV_STAGE !== "dev"
    ? Buffer.from(
        fs.readFileSync(
          path.join(
            secretFolderPath,
            "mongo-secrets",
            "auth-app-db-credentials"
          ),
          { encoding: "utf-8" }
        ),
        "base64"
      ).toString("ascii")
    : fs.readFileSync(
        path.join(secretFolderPath, "mongo-secrets", "auth-app-db-credentials"),
        { encoding: "utf-8" }
      )
) as {
  username: string;
  password: string;
  databases: { databaseName: string; databaseRole: string };
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

// debugging replicasetName
console.log(replicasetName === "");
console.log(replicasetName === undefined);
console.log(replicasetName === null);

const REPLICA_SET_QUERY_PARAMETER =
  replicasetName !== "" &&
  replicasetName !== undefined &&
  replicasetName !== null
    ? `&replicaSet=${replicasetName}`
    : "";

const { AUTH_APP_SERVICE_SERVICE_PORT } = process.env;

console.log({
  accessTokenPrivateKeys,
  accessTokenPublicKeys,
  refreshTokenPrivateKeys,
  refreshTokenPublicKeys,
  clusterEndpoint,
  clusterPort,
  REPLICA_SET_QUERY_PARAMETER,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_AUTH_DB,
  MONGO_ACCOUNTS_DB,
  AUTH_APP_SERVICE_SERVICE_PORT
});

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
