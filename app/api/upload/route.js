import multer from "multer";
import OpenAI from "openai";
import asana from "asana";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads"); // 將檔案存儲到 uploads 目錄
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 你的 OpenAI API 金鑰
});

// 使用命名的 POST 函式來替代 default export
export async function POST(req) {
  const formData = await req.formData();
  return new Promise(async (resolve, reject) => {
    console.log("uploading file");

    // 使用 Multer 處理音訊上傳
    //upload.single("file")(req, {}, async (err) => {
    const file = formData.getAll("file")[0];
    try {
      // 使用 OpenAI 的 API 將音訊轉換為文字
      const transcriptionResponse = await openai.audio.translations.create({
        model: "whisper-1",
        file: file,
      });
      const transcriptionText = transcriptionResponse.text.trim();
      console.log("transcriptionText", transcriptionText);

      // 使用 OpenAI 的 GPT 模型來提取摘要
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `從以下文字用繁體中文以json方式 title,body,date,assignTo 生成摘要（包括標題、正文、日期、分配對象）：\n\n${transcriptionText}`,
          },
        ],
      });
      console.log("summaryResponse", summaryResponse.choices[0].message);
      const summary = summaryResponse.choices[0].message.content;

      // string to json
      const summaryJson = JSON.parse(summary);

      // 創建 Asana 任務
      const taskData = {
        //  projects: [process.env.ASANA_PROJECT_ID], // 請替換為你的 Asana 專案 ID
        //   name: `任務標題：${summary.title}`,
        //   notes: `任務內容：${summary.body}\n日期：${summary.date}\n分配給：${summary.assignTo}`,
        //  assignee: summary.assignTo, // 你需要將分配對象與 Asana 用戶 ID 映射
      };

      // 以下代碼目前被註解，如果你想創建 Asana 任務，請取消註解
      /** 
        const asanaClient = asana.Client.create({
          defaultHeaders: { Authorization: `Bearer ${process.env.ASANA_ACCESS_TOKEN}` },
        });
        const asanaResponse = await asanaClient.tasks.create(taskData);
        */

      resolve(
        new Response(
          JSON.stringify({
            message: "任務創建成功",
            summary: summaryJson,
            // taskId: asanaResponse?.gid || "未知",
          }),
          { status: 200 }
        )
      );
    } catch (error) {
      console.error("Error processing audio or creating Asana task", error);
      reject(
        new Response(
          JSON.stringify({ message: "處理音訊或創建 Asana 任務時出錯" }),
          { status: 500 }
        )
      );
    }
  });
  //});
}
