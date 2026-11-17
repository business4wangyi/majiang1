import { createMajiangApiApp } from './ui/api-server';

const PORT = Number(process.env.MAJIANG_API_PORT || 4100);
const { app } = createMajiangApiApp();

app.listen(PORT, () => {
  console.log(`麻将对局 API 运行在 http://localhost:${PORT}`);
});
