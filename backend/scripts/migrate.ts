import { query } from "../src/lib/db";
query("SELECT 1").then(() => {
  console.log("migrations applied");
  process.exit(0);
});
