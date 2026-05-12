import client from "./config/chroma.js";

async function testChroma() {
  try {
    const collection = await client.createCollection({
      name: "pdf_chunks",
    });

    console.log("Collection Created:", collection.name);
  } catch (error) {
    console.log(error);
  }
}

testChroma();