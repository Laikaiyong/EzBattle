    import { useWallet } from "@solana/wallet-adapter-react";
    import React, { useState } from "react";
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
      const [signState, setSignState] = useState<ButtonState>("initial");
      const { data, error } = useDataFetch<Array<ItemData>>(
        publicKey && signState === "success" ? `/api/items/${publicKey}` : null
      );
      const prevPublicKey = React.useRef<string>(publicKey?.toBase58() || "");

      // Reset the state if wallet changes or disconnects
      React.useEffect(() => {
        if (publicKey && publicKey.toBase58() !== prevPublicKey.current) {
          prevPublicKey.current === publicKey.toBase58();
          setSignState("initial");
        }
      }, [publicKey]);

      // Request signature automatically or through a button
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
        return <p className="text-center p-4">Failed to load items, please try connecting again</p>;
      }

      if (publicKey && signState === "success" && !data) {
        return <p className="text-center p-4">Loading wallet information...</p>;
      }

      const hasFetchedData = publicKey && signState === "success" && data;

      // Prize Pool Component
      const PrizePoolUI = () => {
        const [prizeType, setPrizeType] = useState('player-funded');
        const [entryFee, setEntryFee] = useState('');
        const [sponsor, setSponsor] = useState('');
        const [prizeAmount, setPrizeAmount] = useState('');
        const [nftPrize, setNftPrize] = useState(false);
        const [nftDetails, setNftDetails] = useState('');

        const handlePrizeTypeChange = (e) => {
          setPrizeType(e.target.value);
        };

        const handleFormSubmit = (e) => {
          e.preventDefault();
          const formData = {
            prizeType,
            entryFee,
            sponsor,
            prizeAmount,
            nftPrize,
            nftDetails,
          };
          console.log('Prize Pool Data:', formData);
          // Handle logic for form submission
        };

        return (
          <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white py-8">

            {/* Prize Pool Setup Form */}
            <div className="mt-8 max-w-xl w-full p-6 bg-gray-900 text-white shadow-lg rounded-lg">
              <h2 className="text-2xl font-semibold mb-6">Prize Pool Setup</h2>
              <form onSubmit={handleFormSubmit}>
                {/* Prize Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Prize Pool Type</label>
                  <select
                    value={prizeType}
                    onChange={handlePrizeTypeChange}
                    className="w-full mt-2 p-2 border rounded bg-gray-800 text-white"
                  >
                    <option value="player-funded">Player-Funded</option>
                    <option value="sponsor-funded">Sponsor-Funded</option>
                    <option value="platform-funded">Platform-Funded</option>
                    <option value="nft-prize">NFT Prize</option>
                  </select>
                </div>

                {/* Entry Fee for Player-Funded */}
                {prizeType === 'player-funded' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Entry Fee</label>
                    <input
                      type="number"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      className="w-full p-2 border rounded bg-gray-800 text-white"
                      placeholder="Set entry fee in tokens or USD"
                    />
                  </div>
                )}

                {/* Sponsor Name for Sponsor-Funded */}
                {prizeType === 'sponsor-funded' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Sponsor</label>
                    <input
                      type="text"
                      value={sponsor}
                      onChange={(e) => setSponsor(e.target.value)}
                      className="w-full p-2 border rounded bg-gray-800 text-white"
                      placeholder="Enter sponsor name"
                    />
                  </div>
                )}

                {/* Prize Amount for Sponsor or Platform Funded */}
                {(prizeType === 'sponsor-funded' || prizeType === 'platform-funded') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Prize Amount</label>
                    <input
                      type="number"
                      value={prizeAmount}
                      onChange={(e) => setPrizeAmount(e.target.value)}
                      className="w-full p-2 border rounded bg-gray-800 text-white"
                      placeholder="Enter prize amount"
                    />
                  </div>
                )}

                {/* NFT Prize Details */}
                {prizeType === 'nft-prize' && (
                  <div className="mb-4">
                    <label className="inline-flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={nftPrize}
                        onChange={() => setNftPrize(!nftPrize)}
                        className="mr-2"
                      />
                      Include NFT as part of the prize
                    </label>
                    {nftPrize && (
                      <textarea
                        value={nftDetails}
                        onChange={(e) => setNftDetails(e.target.value)}
                        className="w-full p-2 border rounded bg-gray-800 text-white"
                        placeholder="Describe the NFT prize"
                      />
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Save Prize Pool
                  </button>
                </div>
              </form>
            </div>
            {/* Main Grid with Prize Pool Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Global Esports Fund',
                  amount: 'Up to 50k USDC',
                  link: '#',
                },
                {
                  title: 'Champion’s Battle Grant',
                  amount: 'Up to 25k USDC',
                  link: '#',
                },
                {
                  title: 'Elite Gamer Sponsorship',
                  amount: 'Up to 10k USDC',
                  link: '#',
                },
                {
                  title: 'Pro League Fund',
                  amount: 'Up to 15k JUP',
                  link: '#',
                },
                {
                  title: 'Ultimate Victory Fund',
                  amount: 'Up to 20k DRIFT',
                  link: '#',
                },
                {
                  title: 'Legends of the Arena',
                  amount: 'Up to 30k USDC',
                  link: '#',
                },
                {
                  title: 'Rising Star Fund',
                  amount: 'Up to 5k USDC',
                  link: '#',
                },
                {
                  title: 'Pro Circuit Support',
                  amount: 'Up to 12k USDC',
                  link: '#',
                },
                {
                  title: 'Ultimate Team Battle Grant',
                  amount: 'Up to 7k USDC',
                  link: '#',
                },
                {
                  title: 'Master League Prize',
                  amount: 'Up to 20k USDC',
                  link: '#',
                },
                {
                  title: 'Epic Showdown Fund',
                  amount: 'Up to 18k USDC',
                  link: '#',
                },
                {
                  title: 'Champion’s Glory Sponsorship',
                  amount: 'Up to 15k USDC',
                  link: '#',
                },
              ].map((grant, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-start"
                >
                  <h3 className="text-lg font-bold mb-2">{grant.title}</h3>
                  <p className="text-sm text-gray-400">{grant.amount}</p>
                  <a
                    href={grant.link}
                    className="mt-4 bg-green-500 text-white py-2 px-4 rounded"
                  >
                    Apply Now
                  </a>
                </div>
              ))}
            </div>

            
          </div>
        );
      };

      const TournamentSetupForm = () => {
        const [game, setGame] = useState('');
        const [tournamentName, setTournamentName] = useState('');
        const [entryFee, setEntryFee] = useState('');
        const [prizePool, setPrizePool] = useState('');
        const [tournamentType, setTournamentType] = useState('single-elimination');
        const [playersPerTeam, setPlayersPerTeam] = useState('');
        const [startDateTime, setStartDateTime] = useState('');
        const [daoVoting, setDaoVoting] = useState(false);
        const [nftPrize, setNftPrize] = useState(false);
      
        const handleFormSubmit = (e) => {
          e.preventDefault();
          const formData = {
            game,
            tournamentName,
            entryFee,
            prizePool,
            tournamentType,
            playersPerTeam,
            startDateTime,
            daoVoting,
            nftPrize,
          };
          console.log('Tournament Data:', formData);
          // Handle logic for form submission
        };
      
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Form */}
            <div className="mt-8 max-w-xl w-full p-6 bg-gray-900 text-white shadow-lg rounded-lg">
              <h2 className="text-2xl font-semibold mb-6">Create Tournament</h2>
              <form onSubmit={handleFormSubmit}>
                {/* Game Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Game Selection</label>
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                  >
                    <option value="">Select Game</option>
                    <option value="CSGO">CSGO</option>
                    <option value="DOTA 2">DOTA 2</option>
                    <option value="Fortnite">Fortnite</option>
                    <option value="Call of Duty">Call of Duty</option>
                    <option value="Apex Legends">Apex Legends</option>
                    <option value="Valorant">Valorant</option>
                    <option value="League of Legends">League of Legends</option>
                  </select>
                </div>
      
                {/* Tournament Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Tournament Name</label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                    placeholder="Enter tournament name"
                  />
                </div>
      
                {/* Entry Fee */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Entry Fee (USD/Tokens)</label>
                  <input
                    type="number"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                    placeholder="Set entry fee in tokens or USD"
                  />
                </div>
      
                {/* Prize Pool Setup */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Prize Pool Setup</label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                    placeholder="Specify prize pool distribution or automatic"
                  />
                </div>
      
                {/* Tournament Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Tournament Type</label>
                  <select
                    value={tournamentType}
                    onChange={(e) => setTournamentType(e.target.value)}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                  >
                    <option value="single-elimination">Single-Elimination</option>
                    <option value="double-elimination">Double-Elimination</option>
                    <option value="round-robin">Round-Robin</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
      
                {/* Team/Player Setup */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Team/Player Setup</label>
                  <input
                    type="number"
                    value={playersPerTeam}
                    onChange={(e) => setPlayersPerTeam(e.target.value)}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                    placeholder="Number of players per team or individual participants"
                  />
                </div>
      
                {/* Start Date & Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full p-2 border rounded bg-gray-800 text-white"
                  />
                </div>
      
                {/* DAO Voting Option */}
                <div className="mb-4">
                  <label className="inline-flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={daoVoting}
                      onChange={() => setDaoVoting(!daoVoting)}
                      className="mr-2"
                    />
                    Enable DAO Voting for rule changes or disputes
                  </label>
                </div>
      
                {/* NFT Prize Options */}
                <div className="mb-4">
                  <label className="inline-flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={nftPrize}
                      onChange={() => setNftPrize(!nftPrize)}
                      className="mr-2"
                    />
                    Add optional NFT rewards for winners
                  </label>
                </div>
      
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded"
                  >
                    Submit & Create Tournament
                  </button>
                </div>
              </form>
            </div>
      
            {/* Right Side - Live Preview */}
            <div className="mt-8 p-6 bg-gray-800 text-white shadow-lg rounded-lg">
              <h2 className="text-2xl font-semibold mb-6">Tournament Preview</h2>
              <div className="mb-4">
                <h3 className="text-xl font-bold">{tournamentName || "Tournament Name"}</h3>
                <p className="text-sm text-gray-400">{game || "Select a Game"}</p>
              </div>
      
              <div className="mb-4">
                <p className="text-sm">Entry Fee: {entryFee || "N/A"} USD/Tokens</p>
              </div>
      
              <div className="mb-4">
                <p className="text-sm">Prize Pool: {prizePool || "TBD"}</p>
              </div>
      
              <div className="mb-4">
                <p className="text-sm">Tournament Type: {tournamentType}</p>
              </div>
      
              <div className="mb-4">
                <p className="text-sm">Players per Team: {playersPerTeam || "N/A"}</p>
              </div>
      
              <div className="mb-4">
                <p className="text-sm">Start Date & Time: {startDateTime || "Schedule not set"}</p>
              </div>
      
              <div className="mb-4">
                <p className="text-sm">
                  DAO Voting Enabled: {daoVoting ? "Yes" : "No"}
                </p>
              </div>
      
              <div className="mb-4">
                <p className="text-sm">NFT Prize: {nftPrize ? "Yes" : "No"}</p>
              </div>
      
              <div className="flex-grow">
            <img
              className="w-full h-full object-cover rounded-lg"
              src="https://via.placeholder.com/500x500"
              alt="Tournament Preview"  
            />
          </div>  
            </div>
          </div>
        );
      };
      
      // Profile Page Component
      const ProfilePage = () => {
        const [username, setUsername] = useState('Old Morty');
        const [totalWins, setTotalWins] = useState(10);
        const [tournaments, setTournaments] = useState(20);
        const [earnings, setEarnings] = useState(1500); // in USD
        const [teamInfo, setTeamInfo] = useState('Team Alpha');
        const [matchHistory, setMatchHistory] = useState([
          { agentName: 'AgentName', kills: 12, deaths: 2, result: 'Victory', matchID: '2022040501' },
          { agentName: 'AgentName', kills: 9, deaths: 3, result: 'Victory', matchID: '2022040502' },
        ]);
        const [nfts, setNfts] = useState(['Achievement Title', 'Achievement Title']);
        const [stakedTokens, setStakedTokens] = useState(500);
        const [earnedRewards, setEarnedRewards] = useState(50);
        const [teamMembers, setTeamMembers] = useState(['Player1', 'Player2', 'Player3']);
        const [newMember, setNewMember] = useState(''); // For inviting new members
      
        const handleKickMember = (member) => {
          setTeamMembers(teamMembers.filter((m) => m !== member));
        };
      
        const handleInviteMember = () => {
          if (newMember && !teamMembers.includes(newMember)) {
            setTeamMembers([...teamMembers, newMember]);
            setNewMember('');
          }
        };
      
        return (
          <div className="profile-page flex flex-col items-center min-h-screen bg-gray-900 text-white py-8">
            <div className="max-w-6xl w-full">
              
      
              {/* Row 1: Avatar, Stats, and Team Management */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Avatar & Info */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-4">
                    <img className="w-24 h-24 object-cover rounded-full" src="https://via.placeholder.com/150" alt="Avatar" />
                    <div>
                      <h3 className="text-4xl">{username}</h3>
                      <p className="text-gray-400 mt-2">#332 Shooter | #151 MOBA | #12 Sports</p>
                    </div>
                  </div>
                </div>
      
                {/* Stats */}
                <div className="col-span-1 bg-gray-800 p-4 rounded-lg text-center space-y-2">
                <h3 className="text-xl font-bold text-center mb-4">Player Stats</h3>  
                  <p className="text-lg">Total Wins: {totalWins}</p>
                  <p className="text-lg">Tournament Participation: {tournaments}</p>
                  <p className="text-lg">Total Earnings: {earnings} USD</p>
                </div>
      
                {/* Team Management */}
                <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-xl font-semibold mb-4">Team Management</h4>
                  <div className="space-y-4">
                    {teamMembers.map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <p>{member}</p>
                        <button onClick={() => handleKickMember(member)} className="bg-red-500 px-4 py-1 rounded text-white">Kick</button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-4 mt-4">
                      <input
                        type="text"
                        placeholder="Invite member"
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        className="w-full p-2 border rounded bg-gray-800 text-white"
                      />
                      <button onClick={handleInviteMember} className="bg-green-500 px-4 py-2 rounded text-white">Invite</button>
                    </div>
                  </div>
                </div>
              </div>
      
              {/* Row 2: Staking & Rewards, NFT Collection */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Staking & Rewards */}
                <div className="bg-gray-800 p-6 rounded-lg flex justify-between items-center">
                  <div>
                    <h5 className="text-lg font-semibold text-purple-400">Tokens Staked</h5>
                    <p className="text-gray-400">{stakedTokens} Tokens</p>
                    <h5 className="text-lg font-semibold text-purple-400 mt-4">Rewards Earned</h5>
                    <p className="text-gray-400">{earnedRewards} Tokens</p>
                  </div>
                  <div className="space-x-4">
                    <button className="bg-green-500 px-4 py-2 rounded text-white">Stake Tokens</button>
                    <button className="bg-red-500 px-4 py-2 rounded text-white">Unstake Tokens</button>
                  </div>
                </div>
      
                {/* NFT Collection */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-4">NFT Collection</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {nfts.map((nft, idx) => (
                      <div key={idx} className="flex items-center space-x-4">
                        <img className="w-12 h-12" src="https://via.placeholder.com/50" alt="NFT Icon" />
                        <div>
                          <h5 className="text-purple-400">{nft}</h5>
                          <p className="text-gray-400">April 29, 2022</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
      
              {/* Row 3: Best Achievements & Recent Matches */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Best Achievements */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-4">Best Achievements</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {nfts.map((nft, idx) => (
                      <div key={idx} className="flex items-center space-x-4">
                        <img className="w-12 h-12" src="https://via.placeholder.com/50" alt="Achievement Icon" />
                        <div>
                          <h5 className="text-purple-400">{nft}</h5>
                          <p className="text-gray-400">April 29, 2022</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
      
                {/* Recent Matches */}
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-400 mb-4">Recent Matches</h4>
                  <div className="space-y-4">
                    {matchHistory.map((match, idx) => (
                      <div key={idx} className="flex justify-between">
                        <div>
                          <p className="text-gray-400">{match.agentName}</p>
                          <p>Kills: {match.kills} | Deaths: {match.deaths} | Result: {match.result}</p>
                        </div>
                        <p className="text-purple-400">Match ID: {match.matchID}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
      
            </div>
          </div>
        );
      };
      
      
          
      

  // Leaderboard Page Component
  const LeaderboardPage = () => {
    const [players, setPlayers] = useState([
      {
        username: 'Player1',
        name: 'John Doe',
        earnings: '5000 USD',
        tournamentsWon: 5,
        nftCollections: 10,
        imgSrc: 'https://via.placeholder.com/50',
      },
      {
        username: 'Player2',
        name: 'Jane Smith',
        earnings: '3500 USD',
        tournamentsWon: 3,
        nftCollections: 8,
        imgSrc: 'https://via.placeholder.com/50',
      },
      {
        username: 'Player3',
        name: 'Alice Johnson',
        earnings: '2500 USD',
        tournamentsWon: 2,
        nftCollections: 5,
        imgSrc: 'https://via.placeholder.com/50',
      },
      {
        username: 'Player3',
        name: 'Alice Johnson',
        earnings: '2500 USD',
        tournamentsWon: 2,
        nftCollections: 5,
        imgSrc: 'https://via.placeholder.com/50',
      },
      {
        username: 'Player4',
        name: 'Alice Johnson',
        earnings: '2500 USD',
        tournamentsWon: 2,
        nftCollections: 5,
        imgSrc: 'https://via.placeholder.com/50',
      },
      {
        username: 'Player5',
        name: 'Alice Johnson',
        earnings: '2500 USD',
        tournamentsWon: 2,
        nftCollections: 5,
        imgSrc: 'https://via.placeholder.com/50',
      },
      {
        username: 'Player6',
        name: 'Alice Johnson',
        earnings: '2500 USD',
        tournamentsWon: 2,
        nftCollections: 5,
        imgSrc: 'https://via.placeholder.com/50',
      },
    ]);
  
    return (
      <div className="leaderboard-page flex flex-col items-center min-h-screen bg-gray-900 text-white py-8">
        <h2 className="text-3xl font-semibold mb-6">Leaderboard</h2>
  
        {/* Leaderboard List */}
        <div className="w-full max-w-5xl">
          {players.map((player, idx) => (
            <div
              key={idx}
              className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between mb-4"
            >
              {/* Rank */}
              <div className="text-2xl font-bold text-gray-400 ml-4">{`#${idx + 1}`}</div>
  
              {/* Avatar & Username */}
              <div className="flex items-center w-1/3">
                <img
                  className="w-12 h-12 rounded-full"
                  src={player.imgSrc}
                  alt={player.username}
                />
                <div className="ml-4">
                  <h3 className="text-lg font-bold">{player.username}</h3>
                  <p className="text-sm text-gray-400">{player.name}</p>
                </div>
              </div>
  
              {/* Stats */}
              <div className="flex items-center w-1/3 justify-around">
                <div className="text-center">
                  <p className="text-xl font-semibold">{player.tournamentsWon}</p>
                  <p className="text-sm text-gray-400">Tournaments Won</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">{player.nftCollections}</p>
                  <p className="text-sm text-gray-400">NFTs</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold">{player.earnings}</p>
                  <p className="text-sm text-gray-400">Total Earnings</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // DAO Voting Page Component
  const DAOVotingPage = () => {
    const [proposals, setProposals] = useState([
      {
        title: 'Rule Change: Increase Prize Pool Distribution',
        description:
          'Vote on changing the prize distribution structure to give more rewards to lower-placed participants.',
        options: ['Yes', 'No'],
      },
      {
        title: 'Dispute: Team X vs Team Y in Tournament ABC',
        description: 'Vote on the dispute regarding rule violation in the finals of Tournament ABC.',
        options: ['Team X Wins', 'Team Y Wins', 'Rematch'],
      },
    ]);
  
    return (
      <div className="dao-voting-page flex flex-col items-center min-h-screen bg-gray-900 text-white py-8">
        <h2 className="text-3xl font-semibold mb-6">DAO Voting</h2>
  
        {/* Proposals */}
        <div className="w-full max-w-5xl">
          {proposals.map((proposal, idx) => (
            <div key={idx} className="bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
              <h3 className="text-xl font-bold mb-2">{proposal.title}</h3>
              <p className="text-gray-400 mb-4">{proposal.description}</p>
  
              {/* Voting Options */}
              <div className="flex space-x-4">
                {proposal.options.map((option, optionIdx) => (
                  <button
                    key={optionIdx}
                    className="bg-green-500 px-4 py-2 rounded text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Main Export - Integrating All Pages After Tournament Setup Section
  const MainPage = () => {
    return (
      <div>
        {/* Tournament Setup Section (Previously generated) */}
        <TournamentSetupForm />

        {/* Profile Page */}
        <ProfilePage />

        {/* Leaderboard Page */}
        <LeaderboardPage />

        {/* DAO Voting Page */}
        <DAOVotingPage />
      </div>
    );
  };


      

      return (
        <>
        <div className="flex min-h-screen bg-gray-900 text-white">
          {/* Sidebar */}
          <div className="w-1/4 bg-gray-800 p-4">
            <h2 className="text-xl font-bold mb-4">Upcoming Tournaments</h2>
            <ul className="space-y-4">
              {["CSGO", "DOTA 2", "Fortnite", "Call of Duty", "Apex Legends", "Valorant", "League of Legends"].map((game, idx) => (
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
                {["Fortnite", "CSGO", "Call of Duty", "Valorant", "PUBG", "Rocket League"].map((tournament, idx) => (
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

          </div>  

          
        </div>
      {/* Prize Pool Section */}
      <div className="mt-8">
        <PrizePoolUI />
      </div>

      {/* NFT Section */}
      <div className="mt-8 grid grid-cols-1">
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

      <TournamentSetupForm />
      {/* Profile Page */}
      <ProfilePage />
      {/* Leaderboard Page */}
      <LeaderboardPage />

{/* DAO Voting Page */}
<DAOVotingPage />

    </>
      );
    }
