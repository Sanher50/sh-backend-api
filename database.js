const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false
});

async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log("🗄️ Database connected");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

module.exports = { sequelize, connectDatabase };
