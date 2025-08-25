import { openaiService } from "../services/openaiService";

async function testScriptGeneration() {
  console.log("Testing script generation...");
  
  try {
    const stream = await openaiService.generateScript(
      "Smart Water Bottle",
      "Hydration Campaign",
      "brand-awareness",
      "energetic",
      "product-showcase",
      1,
      "Highlight the temperature tracking feature"
    );

    let generatedScript = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        generatedScript += content;
        process.stdout.write(content);
      }
    }
    
    console.log("\n✅ Script generation successful!");
    console.log("Generated script:", generatedScript);
    return true;
  } catch (error) {
    console.error("❌ Script generation failed:", error);
    return false;
  }
}

async function testImageGeneration() {
  console.log("\n\nTesting image generation...");
  
  try {
    const imageResponse = await openaiService.generateImage(
      "Hey everyone! Meet the Smart Water Bottle - your hydration game-changer!",
      1,
      "Show a person using the smart water bottle at the gym"
    );

    if (!imageResponse.data || imageResponse.data.length === 0) {
      throw new Error("No image generated");
    }

    const imageUrl = imageResponse.data[0].url;
    console.log("✅ Image generation successful!");
    console.log("Generated image URL:", imageUrl);
    console.log("Revised prompt:", imageResponse.data[0].revised_prompt);
    return true;
  } catch (error) {
    console.error("❌ Image generation failed:", error);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Starting OpenAI Service Tests\n");
  
  const scriptTest = await testScriptGeneration();
  const imageTest = await testImageGeneration();
  
  console.log("\n📊 Test Results:");
  console.log(`Script Generation: ${scriptTest ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Image Generation: ${imageTest ? "✅ PASS" : "❌ FAIL"}`);
  
  if (scriptTest && imageTest) {
    console.log("\n🎉 All tests passed! OpenAI integration is working.");
  } else {
    console.log("\n⚠️ Some tests failed. Check your OpenAI API key and configuration.");
  }
  
  process.exit(scriptTest && imageTest ? 0 : 1);
}

if (require.main === module) {
  runTests();
}

export { testScriptGeneration, testImageGeneration };