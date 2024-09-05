import { useWallet } from "@solana/wallet-adapter-react";
import React from "react";
import { fetcher, useDataFetch } from "@utils/use-data-fetch";
import { ItemList } from "@components/home/item-list";
import { ItemData } from "@components/home/item";
import { Button, ButtonState } from "@components/home/button";
import { toast } from "react-hot-toast";
import { Transaction } from "@solana/web3.js";
import { SignCreateData } from "@pages/api/sign/create";
import { SignValidateData } from "@pages/api/sign/validate";

export function HomeContent() {
  const { publicKey, signTransaction } = useWallet();
  const [signState, setSignState] = React.useState<ButtonState>("initial");
  const { data, error } = useDataFetch<Array<ItemData>>(
    publicKey && signState === "success" ? `/api/items/${publicKey}` : null
  );
  const prevPublickKey = React.useRef<string>(publicKey?.toBase58() || "");

  // Reset the state if wallet changes or disconnects
  React.useEffect(() => {
    if (publicKey && publicKey.toBase58() !== prevPublickKey.current) {
      prevPublickKey.current === publicKey.toBase58();
      setSignState("initial");
    }
  }, [publicKey]);

  // This will request a signature automatically but you can have a separate button for that
  React.useEffect(() => {
    async function sign() {
      if (publicKey && signTransaction && signState === "initial") {
        setSignState("loading");
        const signToastId = toast.loading("Signing message...");

        try {
          // Request signature tx from server
          const { tx: createTx } = await fetcher<SignCreateData>(
            "/api/sign/create",
            {
              method: "POST",
              body: JSON.stringify({
                publicKeyStr: publicKey.toBase58(),
              }),
              headers: { "Content-type": "application/json; charset=UTF-8" },
            }
          );

          const tx = Transaction.from(Buffer.from(createTx, "base64"));

          // Request signature from wallet
          const signedTx = await signTransaction(tx);

          // Validate signed transaction
          await fetcher<SignValidateData>("/api/sign/validate", {
            method: "POST",
            body: JSON.stringify({
              signedTx: signedTx.serialize().toString("base64"),
            }),
            headers: { "Content-type": "application/json; charset=UTF-8" },
          });

          setSignState("success");
          toast.success("Message signed", { id: signToastId });
        } catch (error: any) {
          setSignState("error");
          toast.error("Error verifying wallet, please reconnect wallet", {
            id: signToastId,
          });
        }
      }
    }

    sign();
  }, [signState, signTransaction, publicKey]);

  const onSignClick = () => {
    setSignState("initial");
  };

  if (error) {
    return (
      <p className="text-center p-4">
        Failed to load items, please try connecting again
      </p>
    );
  }

  if (publicKey && signState === "success" && !data) {
    return <p className="text-center p-4">Loading wallet information...</p>;
  }

  const hasFetchedData = publicKey && signState === "success" && data;

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 p-4">
        <h2 className="text-xl font-bold mb-4">Upcoming Tournaments</h2>
        <ul className="space-y-4">
          {["CSGO", "DOTA 2", "Fortnite", "Call of Duty"].map((game, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{game}</p>
                <p className="text-xs text-gray-400">Starts in 16 hours</p>
              </div>
              <p className="font-bold text-green-400">8 SOL</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6">
        {/* Featured Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative">
            <img
              className="w-full h-64 object-cover rounded-lg"
              src="https://via.placeholder.com/500x300"
              alt="Tournament Banner"
            />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-3xl font-bold">Greyhound Gaming vs Rabbitohs</h2>
              <p className="text-sm text-gray-300">
                It is a long established fact that a reader will be distracted.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              className="w-full h-64 object-cover rounded-lg"
              src="https://via.placeholder.com/500x300"
              alt="Tournament Banner"
            />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-3xl font-bold">DOTA 2 Championship</h2>
              <p className="text-sm text-gray-300">
                It is a long established fact that a reader will be distracted.
              </p>
            </div>
          </div>
        </div>

        {/* Tournament List */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Fortnite", "CSGO", "Call of Duty"].map((tournament, idx) => (
              <div
                key={idx}
                className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition"
              >
                <h3 className="text-lg font-bold mb-2">{tournament}</h3>
                <p className="text-sm text-gray-400">Tuesday Night Fight</p>
                <p className="text-sm text-gray-400">2v2 G4 Teams</p>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-green-400 font-bold">4.00 SOL</p>
                  <button className="bg-green-500 text-sm text-white py-1 px-4 rounded">
                    Enter Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NFT Section */}
        <div className="grid grid-cols-1">
          {hasFetchedData ? (
            <div>
              <ItemList items={data} />
            </div>
          ) : (
            <div className="text-center">
              {!publicKey && (
                <div className="card border-2 border-primary mb-5">
                  <div className="card-body items-center">
                    <h2 className="card-title text-center text-primary mb-2">
                      Please connect your wallet to get a list of your NFTs
                    </h2>
                  </div>
                </div>
              )}
              {publicKey && signState === "error" && (
                <div className="card border-2 border-primary mb-5">
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-center mb-2">
                      Please verify your wallet manually
                    </h2>
                    <Button
                      state={signState}
                      onClick={onSignClick}
                      className="btn-primary"
                    >
                      Verify wallet
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
