import json
from web3 import Web3
from django.conf import settings
import os

# Ganache RPC
web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))

# Load ABI
BASE_DIR = settings.BASE_DIR
abi_path = os.path.join(BASE_DIR, "exam", "ExamContractABI.json")

with open(abi_path) as f:
    abi = json.load(f)

# Contract address (PASTE YOURS)
CONTRACT_ADDRESS = Web3.to_checksum_address(
    "0x9D7f74d0C41E726EC95884E0e97Fa6129e3b5E99"
)

contract = web3.eth.contract(
    address=CONTRACT_ADDRESS,
    abi=abi
)

# Default admin account (Ganache account[0])
web3.eth.default_account = web3.eth.accounts[0]
