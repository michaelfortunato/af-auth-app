# Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
from cryptography.hazmat.primitives import serialization as crypto_serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import os.path
import sys
def generate_key_pair():
    key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096
            )
    private_key = key.private_bytes(
            crypto_serialization.Encoding.PEM,
            crypto_serialization.PrivateFormat.TraditionalOpenSSL,
            crypto_serialization.NoEncryption())
    public_key = key.public_key().public_bytes(
            crypto_serialization.Encoding.PEM,
            crypto_serialization.PublicFormat.SubjectPublicKeyInfo
            )

    private_key_str = private_key.decode('utf-8')
    public_key_str = public_key.decode('utf-8')
    
    return [private_key_str, public_key_str]

def save_key_pair(numKeys=6):
        parentDir = os.path.dirname(os.path.abspath(__file__))
        for i in range(numKeys):
                [private_key, public_key] = generate_key_pair()

                private_key_file = open(os.path.join(parentDir, f'key-{i}.pem'), "w")
                private_key_file.write(private_key)
                private_key_file.close()
                public_key_file = open(os.path.join(parentDir, f'key-{i}.pem.pub'), "w")
                public_key_file.write(public_key)
                public_key_file.close()
        return 5
save_key_pair()