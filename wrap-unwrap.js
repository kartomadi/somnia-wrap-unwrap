const { ethers } = require("ethers");
const readline = require("readline-sync");
require("dotenv").config();

// 🔧 CONFIG
const RPC_URL = "https://dream-rpc.somnia.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/['"]+/g, ''); // Pastikan tanpa tanda kutip
const WSTT_ADDRESS = "0xF22eF0085f6511f70b01a68F360dCc56261F768a";

// ABI Kontrak WSTT
const WSTT_ABI = [
  "function deposit() payable",
  "function withdraw(uint256 wad)",
  "function balanceOf(address owner) view returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const wstt = new ethers.Contract(WSTT_ADDRESS, WSTT_ABI, wallet);

  console.log("\n🚀 Multi-Transaction WSTT/STT Wrapper");

  // 1. Pilih aksi (Wrap/Unwrap)
  console.log("1. Wrap STT → WSTT");
  console.log("2. Unwrap WSTT → STT");
  const choice = readline.question("Pilih (1/2): ");

  // 2. Input jumlah transaksi dan delay
  const txCount = parseInt(readline.question("Jumlah transaksi: "));
  const delaySec = parseInt(readline.question("Delay antar transaksi (detik): "));
  const amountPerTx = readline.question("Jumlah per transaksi (contoh: 0.1): ");

  // 3. Konfirmasi
  console.log(`\n🔎 Akan melakukan ${txCount} transaksi:`);
  console.log(`- Tipe: ${choice === '1' ? 'Wrap STT → WSTT' : 'Unwrap WSTT → STT'}`);
  console.log(`- Jumlah per TX: ${amountPerTx}`);
  console.log(`- Delay: ${delaySec} detik`);
  const confirm = readline.question("Lanjutkan? (y/n): ");

  if (confirm.toLowerCase() !== 'y') {
    console.log("❌ Dibatalkan!");
    return;
  }

  // 4. Eksekusi transaksi berulang
  for (let i = 1; i <= txCount; i++) {
    try {
      const parsedAmount = ethers.parseEther(amountPerTx);
      
      if (choice === '1') {
        // Wrap STT → WSTT
        const tx = await wstt.deposit({ value: parsedAmount });
        console.log(`\n✅ TX ${i}/${txCount} | Wrap ${amountPerTx} STT → WSTT`);
        console.log(`TX Hash: ${tx.hash}`);
      } else {
        // Unwrap WSTT → STT
        const tx = await wstt.withdraw(parsedAmount);
        console.log(`\n✅ TX ${i}/${txCount} | Unwrap ${amountPerTx} WSTT → STT`);
        console.log(`TX Hash: ${tx.hash}`);
      }

      // Delay antar transaksi (kecuali transaksi terakhir)
      if (i < txCount) {
        console.log(`⏳ Menunggu ${delaySec} detik...`);
        await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
      }

    } catch (error) {
      console.log(`❌ Gagal TX ${i}:`, error.message);
      break;
    }
  }

  // 5. Cek balance akhir
  const sttBalance = await provider.getBalance(wallet.address);
  const wsttBalance = await wstt.balanceOf(wallet.address);
  console.log("\n💵 Balance Akhir:");
  console.log(`- STT: ${ethers.formatEther(sttBalance)}`);
  console.log(`- WSTT: ${ethers.formatEther(wsttBalance)}`);
}

main().catch(console.error);