// import axios from 'axios';

// const GetAiResponse = async (messages) => {
   
//     const apiKey = import.meta.env.VITE_OPENAI_KEY;
    
    
//     if (!apiKey) {
//         console.error("OpenAI API key is missing. Check your environment variables.");
//         return "Configuration error: API key not found. Please check server configuration.";
//     }
    
//     try {
//         console.log("Sending request to OpenAI API...");
        
//         const response = await axios.post(
//             "https://api.openai.com/v1/chat/completions", 
//             {
//                 model: "gpt-3.5-turbo",
//                 messages: messages,
//                 max_tokens: 500
//             },
//             {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${apiKey}`
//                 }
//             }
//         );
        
//         console.log("AI response received:", response.status);
        
//         if (response.data && response.data.choices && response.data.choices.length > 0) {
//             return response.data.choices[0].message.content;
//         } else {
//             console.error("Invalid response structure from OpenAI:", response.data);
//             return "Received an unexpected response format from AI service.";
//         }
        
//     } catch (error) {
   
//         if (error.response) {
//            console.error("OpenAI API error:", error.response.status, error.response.data);
            
//             if (error.response.status === 401) {
//                 return "Authentication error: Invalid API key. Please check your API key configuration.";
//             } else if (error.response.status === 429) {
//                 return "Rate limit exceeded: The AI service is currently overloaded. Please try again later.";
//             }
//         } else if (error.request) {
           
//             console.error("No response received from OpenAI API:", error.request);
//             return "Network error: Could not connect to AI service. Please check your internet connection.";
//         } else {
//             console.error("Error setting up request to OpenAI:", error.message);
//         }
        
//         return "AI Bot is not available right now. Please try again later.";
//     }
// };

// export default GetAiResponse;