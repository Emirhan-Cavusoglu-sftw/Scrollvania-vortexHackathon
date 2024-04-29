"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useReadContract, useWatchContractEvent } from "wagmi";
import { config } from "../utils/config";
import {
  bundlerClient,
  getGasPrice,
  entryPointContract,
  incrementFuncData,
} from "../utils/helpers";

import {
  entryPointABI,
  eventContractABI,
  eventContractAddress,
  gameAccountABI,
  lobbyFactoryABI,
  lobbyFactoryAddress,
} from "../utils/constants";
import { readContract, writeContract } from "wagmi/actions";
import { scrollSepolia } from "wagmi/chains";
import { calculateSenderAddress, factoryData } from "@/utils/helpers";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { parseEther, Hex } from "viem";
import { get } from "http";

export default function Home() {
  const [lobbyCode, setLobbyCode] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [lobbies, setLobbies] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getLobbies = async () => {
      const result = (await readContract(config, {
        abi: lobbyFactoryABI,
        address: lobbyFactoryAddress,
        functionName: "getDeployedLobbies",
        chainId: scrollSepolia.id,
      })) as any;

      // Filter out the objects where gameFinished is false
      const filteredLobbies = result.filter(
        (lobby) => lobby.gameFinished === false
      );

      // Set the filtered lobbies state
      setLobbies(filteredLobbies);
    };

    getLobbies();
  }, []);

  const consoleLobbies = async () => {
    console.log(lobbies);
  };

  const handleCreateLobby = () => {
    const generatedCode = generateRandomCode();
    setLobbyCode(generatedCode);
    setShowPopup(true);
  };

  useWatchContractEvent({
    address: eventContractAddress,
    abi: eventContractABI,
    eventName: "ev",
    chainId: scrollSepolia.id,

    onLogs(logs) {
      console.log("New logs!", logs);
    },
  });

  // const result = useReadContract({
  //   abi: eventContractABI,
  //   address: eventContractAddress,
  //   functionName: "count",
  //   chainId: config.chains[0].id,
  // }).then((result) => {console.log(result)});

  const fundEntryPoint = async () => {
    const result = await writeContract(config, {
      abi: entryPointABI,
      address: ENTRYPOINT_ADDRESS_V07,
      functionName: "depositTo",
      chainId: scrollSepolia.id,
      args: ["0x581d0b761C28F1daE307A57CCd6e61ebD52c734d"],
      value: parseEther("0.1"),
    });
  };

  const consoleResult = async () => {
    const result = await readContract(config, {
      abi: eventContractABI,
      address: eventContractAddress,
      functionName: "count",
      chainId: scrollSepolia.id,
    });
    console.log(result);
  };
  const consoleCount = async () => {
    const result = await readContract(config, {
      abi: gameAccountABI,
      address: "0x581d0b761C28F1daE307A57CCd6e61ebD52c734d",
      functionName: "count",
      chainId: scrollSepolia.id,
    });
    console.log(result);
  };

  const incrementOP = async () => {
    let nonce = await (entryPointContract as any).read.getNonce([
      "0x581d0b761C28F1daE307A57CCd6e61ebD52c734d",
      0,
    ]);
    let gasPrice = await getGasPrice();

    // const senderAddress = await calculateSenderAddress(factoryData);

    const userOperationHash = await bundlerClient.sendUserOperation({
      userOperation: {
        sender: "0x581d0b761C28F1daE307A57CCd6e61ebD52c734d",
        nonce: BigInt(nonce),
        callData: incrementFuncData as Hex,
        maxFeePerGas: BigInt(gasPrice.fast.maxPriorityFeePerGas),
        maxPriorityFeePerGas: BigInt(gasPrice.fast.maxPriorityFeePerGas),
        paymasterVerificationGasLimit: BigInt(1000000),
        signature: "0x" as Hex,
        callGasLimit: BigInt(1_000_000),
        verificationGasLimit: BigInt(1_000_000),
        preVerificationGas: BigInt(1_000_000),
      },
    });

    console.log("Received User Operation hash:" + userOperationHash);

    console.log("Querying for receipts...");
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOperationHash,
    });

    const txHash = receipt.receipt.transactionHash;

    console.log(`UserOperation included: ${txHash}`);
  };

  const generateRandomCode = () => {
    const characters = "0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };
  const consoleSenderAddress = async () => {
    const senderAddress = await calculateSenderAddress(factoryData);
    console.log(senderAddress);
  };

  const handleJoinLobby = () => {
    const inputCode = prompt("Lobi davet kodunu girin:");
    if (inputCode === lobbyCode) {
      window.location.href = `/lobby/${lobbyCode}`;
    } else {
      alert("Hatalı lobi davet kodu!");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[url('/bgImage.png')] bg-center bg-cover ">
        <h3 className="text-8xl flex justify-center pt-14 text-white opacity-85 font-extrabold">
          Welcome to Scrollvania
        </h3>
        <div className="flex flex-row justify-evenly items-center ">
          <div className="w-[700px] h-[500px] bg-white rounded-3xl opacity-80 flex flex-col">
            {lobbies &&
              lobbies.map((lobby, index) => {
                return (
                  <Link
                    key={index}
                    href={`/lobby/${lobby.lobbyAddress}`}
                  >
                    <div
                      key={index}
                      className="flex flex-row justify-between p-2"
                    >
                      <p>{lobby.lobbyAddress}</p>
                      <p>
                        {lobby.gameFinished
                          ? "Oyun Bitti"
                          : "Oyun Devam Ediyor"}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
          <Image
            src={"/vampir.png"}
            alt="Vampir"
            width={400}
            height={1000}
            className="flex flex-col pt-[171px]"
          />

          <div className="flex flex-col justify-center items-center space-y-28">
            <button
              className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl"
              onClick={() => setShowPopup(true)}
            >
              How to Play
            </button>
            <button
              className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl"
              onClick={() => consoleResult()}
            >
              Connect Wallet
            </button>
            <button
              className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl"
              onClick={() => consoleSenderAddress()}
            >
              Sender Address
            </button>
            <button
              className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl"
              onClick={() => fundEntryPoint()}
            >
              FundMe
            </button>
            <button
              className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl"
              onClick={() => consoleCount()}
            >
              Count
            </button>
            <button
              className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl"
              onClick={() => incrementOP()}
            >
              Increment
            </button>
            <button
              className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl"
              onClick={() => consoleLobbies()}
            >
              Lobbies
            </button>
            <button className="bg-white opacity-80 w-96 h-16 hover:bg-purple-600 text-black font-bold text-3xl py-2 px-4 rounded-3xl">
              Join Lobby
            </button>
            
            <ConnectButton />
            
          </div>
        </div>
        {/* <h1 className="flex justify-center font-bold text-2xl pt-44">
            Welcome to Scrollvania 🧛‍♂️
          </h1> */}

        {/* <ConnectButton /> */}

        {/* <div className="flex flex-row space-x-5">
            <button
              onClick={handleCreateLobby}
              className="bg-purple-900 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-2xl"
            >
              Lobi Oluştur
            </button> */}

        {/* <button
              onClick={handleJoinLobby}
              className="bg-purple-900 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-2xl"
            >
              Lobiye Katıl
            </button>
          </div> */}

        {showPopup && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg">
              <button
                onClick={() => setShowPopup(false)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-2xl mt-2"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* <div className="max-w-lg bg-indigo-900 p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-center mb-8">
              How to Play: Scrollvania
            </h1>
            <p className="text-lg mb-4">
              Welcome to Scrollvania, a gripping game of strategy and deception
              set in a cursed village!
            </p>
            <h2 className="text-xl font-semibold mb-4">Objective:</h2>
            <p className="mb-4">
              In Scrollvania, players are divided into two factions: the
              Villagers and the Vampire. The Villagers&apos; goal is to identify
              and eliminate the Vampire before they&apos;re all turned into
              vampires themselves. The Vampire&apos;s objective is to convert
              all the Villagers or avoid being identified and eliminated.
            </p>
            <h2 className="text-xl font-semibold mb-4">Game Setup:</h2>
            <p className="mb-4">
              <strong>Joining the Game:</strong> Players join Scrollvania by
              depositing a certain amount of Ether (ETH) into the smart
              contract.
            </p>
            <p className="mb-4">
              <strong>Choosing Roles:</strong> At the beginning of each round,
              players are randomly assigned the role of either a Villager or the
              Vampire.
            </p>
            <p className="mb-4">
              <strong>Swap Phase:</strong> Before the game begins, there is a
              swap phase where players can engage in a swap transaction. The
              player who pays the least gas fee becomes the Vampire, while the
              player who pays the most becomes a Villager. This adds an element
              of chance and strategy to the game.
            </p>
            <h2 className="text-xl font-semibold mb-4">Gameplay:</h2>
            <p className="mb-4">
              <strong>Daytime:</strong> During the day, players deliberate and
              vote on who they believe is the Vampire. The player with the most
              votes is lynched and eliminated from the game. If the Vampire is
              successfully identified, the Villagers win the round. If not, the
              game continues.
            </p>
            <p className="mb-4">
              <strong>Nighttime:</strong> During the night, the Vampire selects
              one player to convert into a vampire. The converted player is
              eliminated from the game. The cycle of Daytime and Nighttime
              continues until either all the Villagers are turned into vampires
              (Vampire victory) or the Vampire is identified and eliminated
              (Villager victory).
            </p>
            <h2 className="text-xl font-semibold mb-4">Win Conditions:</h2>
            <p className="mb-4">
              <strong>Villager Victory:</strong> The Villagers win if they
              successfully identify and eliminate the Vampire.
            </p>
            <p className="mb-4">
              <strong>Vampire Victory:</strong> The Vampire wins if all the
              Villagers are turned into vampires.
            </p>
            <h2 className="text-xl font-semibold mb-4">Endgame:</h2>
            <p className="mb-4">
              The game ends when one of the win conditions is met. If the
              Villagers win, the total Ether deposited by all players is evenly
              distributed among the surviving Villagers. If the Vampire wins,
              the Vampire claims the entire pot of Ether.
            </p>
            <p className="text-gray-600">
              <strong>
                Good luck, and may the best strategist prevail in Scrollvania!
              </strong>
            </p>
          </div> */}
      </div>
    </>
  );
}
