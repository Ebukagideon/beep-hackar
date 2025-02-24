import { SigningCosmWasmClient, CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

export interface Coin {
    readonly denom: string;
    readonly amount: string;
}

// Existing types remain the same
export interface Config {
  admin: string;
  supported_tokens: string[];
  default_timeout_height: number;
  supported_protocols: string[];
}

export interface BeepCoin {
  token: string;
  amount: string;
  is_native: boolean;
}

export interface ExpectedToken {
  token: string;
  is_native: boolean;
  amount: string;
  target_address?: string;
}

export type IntentStatus = "Active" | "Completed" | "Expired";

export interface IntentType {
  Swap: {
    output_tokens: ExpectedToken[];
  };
}

export interface Intent {
  id: string;
  creator: string;
  input_tokens: BeepCoin[];
  intent_type: IntentType;
  executor?: string;
  status: IntentStatus;
  created_at: number;
  timeout: number;
  tip: BeepCoin;
}

// Query response types
export interface ConfigResponse {
  admin: string;
  supported_tokens: string[];
  default_timeout_height: number;
}

export interface IntentResponse {
  intent: Intent;
}

export interface IntentsResponse {
  intents: Intent[];
}

export interface UserNonceResponse {
  nonce: string; // u128 comes as string in JSON
}

export class BeepContractClient {
  private signingClient: SigningCosmWasmClient | null = null;
  private queryClient: CosmWasmClient | null = null;
  private readonly contractAddress: string;
  private readonly rpcEndpoint: string;
  private wallet: DirectSecp256k1HdWallet | null = null;

  constructor(
    contractAddress: string,
    rpcEndpoint: string
  ) {
    this.contractAddress = contractAddress;
    this.rpcEndpoint = rpcEndpoint;
  }

  async connect(mnemonic: string) {
    // Set up signing client for execute messages
    this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "neutron"
    });

    this.signingClient = await SigningCosmWasmClient.connectWithSigner(
      this.rpcEndpoint,
      this.wallet,
      { gasPrice: GasPrice.fromString("0.025untrn") }
    );

    // Set up query client
    this.queryClient = await CosmWasmClient.connect(this.rpcEndpoint);

    return this.signingClient;
  }

  // Query methods - don't require signing
  async getConfig(): Promise<ConfigResponse> {
    if (!this.queryClient) {
      throw new Error("Query client not initialized. Call connect() first.");
    }

    return await this.queryClient.queryContractSmart(
      this.contractAddress,
      { get_config: {} }
    );
  }

  async getIntent(id: string): Promise<IntentResponse> {
    if (!this.queryClient) {
      throw new Error("Query client not initialized. Call connect() first.");
    }

    return await this.queryClient.queryContractSmart(
      this.contractAddress,
      { get_intent: { id } }
    );
  }

  async listIntents(
    startAfter?: string,
    limit?: number
  ): Promise<IntentsResponse> {
    if (!this.queryClient) {
      throw new Error("Query client not initialized. Call connect() first.");
    }

    return await this.queryClient.queryContractSmart(
      this.contractAddress,
      {
        list_intents: {
          start_after: startAfter,
          limit: limit
        }
      }
    );
  }

  async getUserNonce(address: string): Promise<UserNonceResponse> {
    if (!this.queryClient) {
      throw new Error("Query client not initialized. Call connect() first.");
    }

    return await this.queryClient.queryContractSmart(
      this.contractAddress,
      { get_user_nonce: { address } }
    );
  }

  // Existing execute methods remain the same but use signingClient instead of client
  private async ensureSigningConnection() {
    if (!this.signingClient) {
      throw new Error("Signing client not connected. Call connect() first.");
    }
    return this.signingClient;
  }

  async getAddress(): Promise<string> {
    if (!this.wallet) {
      throw new Error("Wallet not initialized. Call connect() first.");
    }
    const [firstAccount] = await this.wallet.getAccounts();
    return firstAccount.address;
  }

  // Increase allowance for CW20 tokens
  async increaseAllowance(
    cw20TokenContract: string,
    spender: string,
    amount: string,
    funds?: Coin[]
  ) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();

    const msg = {
        increase_allowance: {
            spender: spender,
            amount: amount
        }
    };

    return await client.execute(
        senderAddress,
        cw20TokenContract,
        msg,
        "auto",
        undefined,
        funds
    );
  }

  // Example of an updated execute method
  async createIntent(
    inputTokens: BeepCoin[],
    outputTokens: ExpectedToken[],
    tip: BeepCoin,
    timeout?: number,
    funds?: Coin[]
  ) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      create_intent: {
        intent_type: {
          Swap: {
            output_tokens: outputTokens
          }
        },
        input_tokens: inputTokens,
        timeout,
        tip
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto",
      undefined,
      funds
    );
  }
  async fillIntent(
    intentId: string,
    outputTokens: ExpectedToken[],
    funds?: Coin[]
  ) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      fill_intent: {
        intent_id: intentId,
        intent_type: {
          Swap: {
            output_tokens: outputTokens
          }
        }
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto",
      undefined,
      funds
    );
  }

  async withdrawIntentFund(intentId: string) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      withdraw_intent_fund: {
        intent_id: intentId
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto"
    );
  }

  async updateAdmin(newAdmin: string) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      update_admin: {
        new_admin: newAdmin
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto"
    );
  }

  async addSupportedTokens(tokens: string[]) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      add_supported_tokens: {
        tokens
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto"
    );
  }

  async removeSupportedTokens(tokens: string[]) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      remove_supported_tokens: {
        tokens
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto"
    );
  }

  async addSupportedProtocols(protocols: string[]) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      add_supported_protocols: {
        protocols
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto"
    );
  }

  async removeSupportedProtocols(protocols: string[]) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      remove_supported_protocols: {
        protocols
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto"
    );
  }

  async updateDefaultTimeoutHeight(defaultTimeoutHeight: number) {
    const client = await this.ensureSigningConnection();
    const senderAddress = await this.getAddress();
    
    const msg = {
      update_default_timeout_height: {
        default_timeout_height: defaultTimeoutHeight
      }
    };

    return await client.execute(
      senderAddress,
      this.contractAddress,
      msg,
      "auto"
    );
  }
}
