const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");
const fs = require("fs");

puppeteer.use(StealthPlugin());

const proxies = [
    "http://lzrcapki:it91v8v6n3nc@173.211.0.148:6641",
    "http://lzrcapki:it91v8v6n3nc@23.94.138.75:6349",
    "http://lzrcapki:it91v8v6n3nc@173.0.9.70:5653",
    "http://lzrcapki:it91v8v6n3nc@173.0.9.209:5792",
    "http://lzrcapki:it91v8v6n3nc@107.172.163.27:6543",
    "http://lzrcapki:it91v8v6n3nc@198.23.239.134:6540"
];

function getRandomProxy() {
  return proxies[Math.floor(Math.random() * proxies.length)];
}

async function getMailTMEmail() {
  try {
    const domainRes = await axios.get("https://api.mail.tm/domains");
    const domain = domainRes.data["hydra:member"][0].domain;
    const email = `capcut_${Date.now()}@${domain}`;
    const password = "password123";

    const accountRes = await axios.post("https://api.mail.tm/accounts", {
      address: email,
      password: password
    });

    const tokenRes = await axios.post("https://api.mail.tm/token", {
      address: email,
      password: password
    });

    const account = {
      email,
      password,
      token: tokenRes.data.token
    };
    
    fs.appendFileSync("accounts.txt", `${email}|${password}\n`);
    console.log(`📩 Email dibuat: ${email}`);
    return account;
  } catch (error) {
    console.error("❌ Gagal mendapatkan email:", error.message);
    return null;
  }
}

async function getOTP(token) {
  try {
    console.log("⌛ Menunggu email OTP...");
    let otp = null;
    
    while (!otp) {
      const messagesRes = await axios.get("https://api.mail.tm/messages", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const messages = messagesRes.data["hydra:member"];
      
      console.log(`📩 Email ditemukan: ${messages.length}`);
      for (const msg of messages) {
        //console.log(`📨 Subject Email: ${msg.subject}`);
        
        if (msg.subject.includes("CapCut") || msg.subject.includes("Kode OTP")) {
          console.log("🔎 Email CapCut ditemukan, membaca isi...");
          
          const messageDetail = await axios.get(`https://api.mail.tm/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          //console.log("📜 Isi Email:", messageDetail.data.text);

          const otpMatch = messageDetail.data.text.match(/\b\d{6}\b/);
          if (otpMatch) {
            otp = otpMatch[0];
            console.log(`✅ OTP ditemukan: ${otp}`);
            return otp;
          }
        }
      }

      console.log("⏳ Menunggu 5 detik sebelum mencoba lagi...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error("❌ Gagal mendapatkan OTP:", error.message);
    return null;
  }
}

async function registerCapCut(email, passw, token) {
  const proxy = getRandomProxy();
  console.log(`🌍 Menggunakan proxy: ${proxy}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${proxy.split('@')[1]}`
    ]
  });

  const page = await browser.newPage();
  const [username, password] = proxy.split('@')[0].replace('http://', '').split(':');
  await page.authenticate({ username, password });
  await page.setUserAgent(getRandomUserAgent());
  
  await page.goto("https://www.capcut.com/activity/free-membership/MS4wLjABAAAAKs4uOW0yVUdHsPT1mPAHNfN06ZcOxX5o_eyZnXncWdSpbm2HsU8CV_RGZ76OQ3OX?sec_from_uid=MS4wLjABAAAAKs4uOW0yVUdHsPT1mPAHNfN06ZcOxX5o_eyZnXncWdSpbm2HsU8CV_RGZ76OQ3OX&invite_params=%7B%22campaign_key%22%3A%22koc_referral_r1%22%2C%22invite_token%22%3A%22sta1-trBD-fKEWuxjWkIg6F6T_ufrhSzmyNcBYhm-AD9IN81dHFocrCLvtneGlWoFlVSOzvp--6ZbfVe801IECb-3qqAmChL8P0AVky0FmJRUZ5A7A4bQ06mIC4stLPeovjmBZz6nriX0YnHHcoYUghSH0Q%22%2C%22master_uid%22%3A%227216106273917043714%22%2C%22master_language%22%3A%22en%22%2C%22from_uid%22%3A%227216106273917043714%22%7D&share_token=079ae627-cfb8-45ed-854f-c9a09a54f74d&enter_from=activity_show&region=US&language=en&platform=copy_link&is_copy_link=1&ug_task_key=koc_referral_r1", { waitUntil: "networkidle2" });
  console.log("✅ Berhasil membuka halaman CapCut!");

  // Isi email
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector('#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div.lv_sign_in_panel-content > div.lv_sign_in_panel-form > div.lv_sign_in_panel-form-email > input');
  await page.type("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div.lv_sign_in_panel-content > div.lv_sign_in_panel-form > div.lv_sign_in_panel-form-email > input", email);
  console.log("✅ Berhasil isi email!");

  // isi password
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div.lv_sign_in_panel-content > div.lv_sign_in_panel-form > div.lv_sign_in_panel-form-password > div > span > span > input");
  await page.type("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div.lv_sign_in_panel-content > div.lv_sign_in_panel-form > div.lv_sign_in_panel-form-password > div > span > span > input", passw);
  console.log("✅ Berhasil isi password!");

  // Klik tombol "sign_up"
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div.lv_sign_in_panel-content > div.lv_sign_in_panel-form > button");
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div.lv_sign_in_panel-content > div.lv_sign_in_panel-form > button");
  console.log("✅ Berhasil klik tombol sign_up!");

  //klik dropbox bulan
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div:nth-child(1) > div.lv_birthday-select-value", { visible: true });
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div:nth-child(1) > div.lv_birthday-select-value");
  console.log("✅ Berhasil klik dropBox Bulan!");

  //pilih januari
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div.lv-dropdown-popup-visible.lv_birthday-select.active.lv-dropdown-open > div:nth-child(4) > span > div > div > div.lv-dropdown-menu-item.lv-dropdown-menu-selected.lv-dropdown-menu-item-size-default > svg", { visible: true });
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div.lv-dropdown-popup-visible.lv_birthday-select.active.lv-dropdown-open > div:nth-child(4) > span > div > div > div.lv-dropdown-menu-item.lv-dropdown-menu-selected.lv-dropdown-menu-item-size-default > svg");
  console.log("✅ Berhasil pilih Januari!");

  //klik dropbox tanggal
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div:nth-child(2) > div.lv_birthday-select-value", { visible: true });
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div:nth-child(2) > div.lv_birthday-select-value");
  console.log("✅ Berhasil klik dropBox Hari!");

  //pilih tanggal 3
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div.lv-dropdown-popup-visible.lv_birthday-select.active.lv-dropdown-open > div:nth-child(4) > span > div > div > div.lv-dropdown-menu-item.lv-dropdown-menu-selected.lv-dropdown-menu-item-size-default > svg", { visible: true });
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div.lv-dropdown-popup-visible.lv_birthday-select.active.lv-dropdown-open > div:nth-child(4) > span > div > div > div.lv-dropdown-menu-item.lv-dropdown-menu-selected.lv-dropdown-menu-item-size-default > svg");
  console.log("✅ Berhasil pilih 1!");

  //klik dropbox tahun
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div:nth-child(3) > div.lv_birthday-select-value", { visible: true });
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div:nth-child(3) > div.lv_birthday-select-value");
  console.log("✅ Berhasil klik dropBox Tahun!");

  //pilih tahun
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div.lv-dropdown-popup-visible.lv_birthday-select.active.lv-dropdown-open > div:nth-child(4) > span > div > div > div.lv-dropdown-menu-item.lv-dropdown-menu-selected.lv-dropdown-menu-item-size-default > svg", { visible: true });
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div > div.lv-dropdown-popup-visible.lv_birthday-select.active.lv-dropdown-open > div:nth-child(4) > span > div > div > div.lv-dropdown-menu-item.lv-dropdown-menu-selected.lv-dropdown-menu-item-size-default > svg");
  console.log("✅ Berhasil pilih 1990!");

  // Klik tombol "next_step"
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > button");
  await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > button");
  console.log("✅ Berhasil klik tombol next_step!");

  await new Promise(resolve => setTimeout(resolve, 1000));
  const otp = await getOTP(token);
  if (otp) {
    await page.type("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > div.lv_sign_in_panel-code-input-wrapper > input", otp);
    await page.click("#root > div > div > div > div.sign_in-container > div.sign_in-activity-wrapper > div.lv-spin > div > div > div > button");
    console.log("✅ OTP berhasil dimasukkan!");
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("✅ Sukses Mendaftar Capcut!");
  } else {
    console.log("❌ Gagal mendapatkan OTP!");
  }


  await browser.close();
}

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

(async () => {
  const mailData = await getMailTMEmail();
  if (mailData) {
    await registerCapCut(mailData.email, mailData.password, mailData.token);
  }
})();