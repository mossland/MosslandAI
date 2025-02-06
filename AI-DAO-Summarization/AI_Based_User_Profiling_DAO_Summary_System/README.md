# DAO Tendency Prototype

This project is a prototype experiment to analyze user tendencies in a DAO (Decentralized Autonomous Organization) by combining survey responses, historical activity data, and user opinions processed via OpenAI's GPT-4 API. The prototype simulates a virtual DAO member ("Alice") with sample data and aggregates her tendencies across various dimensions such as:

- **Progressive vs Conservative**
- **Economic vs Social**
- **Long-term vs Short-term**

## Files

- **dao_tendency_prototype.py**: The main Python script that implements the user tendency analysis.
- **README.md**: This file.
- **requirements.txt**: Lists the required Python packages.

## Requirements

- Python 3.7 or later
- OpenAI Python package

## Installation

1. **Clone the Repository** (or download the project files):

   ```bash
   git clone <repository_url>
   ```

2. **Navigate to the Project Directory**:

   ```bash
   cd <project_directory>
   ```

3. **(Optional) Create and Activate a Virtual Environment**:

   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```

4. **Install the Required Packages**:

   ```bash
   pip install -r requirements.txt
   ```

## Setup

Set your OpenAI API key as an environment variable. For example, on Linux or macOS:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Alternatively, you can directly assign your API key in the `dao_tendency_prototype.py` file by uncommenting and editing the line:

```python
# openai.api_key = "your-api-key-here"
```

## Usage

To run the prototype experiment, execute the following command in your terminal:

```bash
python dao_tendency_prototype.py
```

The script will simulate the virtual user "Alice" and output the aggregated tendency profile to the console.
