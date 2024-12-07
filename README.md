
# Travel Planning Assistant

This application is an intelligent travel planning assistant built using OpenAI's API. It leverages modular agents to handle specific tasks, including gathering user preferences, creating travel itineraries, optimizing plans, and fetching weather data. 

## Features

- **Dynamic User Interaction**: Understands user input and asks follow-up questions to gather necessary details.
- **Modular Agents**:
  - **Questionnaire Agent**: Collects missing details like city, budget, dates, interests, etc.
  - **Planner Agent**: Creates a detailed travel itinerary.
  - **Optimization Agent**: Refines travel plans based on user constraints.
  - **Weather Agent**: Fetches weather data for the travel destination.
- **Routing Logic**: Ensures smooth transitions between agents based on available data.

---

## Installation

### Prerequisites

1. Python 3.8 or later
2. Install the `openai` library:
   ```bash
   pip install openai
   ```

3. Ensure you have an API key for OpenAI.


### Running the Application
   ```
the app can be accessed at 
  `http://127.0.0.1:8001/frontend/index.html`


The primary function for user interaction is `generate_llm_response`. Use it to input user queries and receive responses from the assistant.


