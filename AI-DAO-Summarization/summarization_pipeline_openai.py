import openai
import spacy

# Load spaCy model for preprocessing
nlp = spacy.load("en_core_web_sm")

# OpenAI API key configuration
openai.api_key = "YOUR_OPENAI_API_KEY"

def preprocess_text(text):
    """Cleans and preprocesses input text using spaCy."""
    doc = nlp(text)
    sentences = [sent.text for sent in doc.sents if len(sent.text.strip()) > 10]  # Keep meaningful sentences
    return " ".join(sentences)

def summarize_text_with_openai(text):
    """Generates a summary of the input text using OpenAI's GPT-4-turbo API."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes text."},
                {"role": "user", "content": text}
            ]
        )
        return response['choices'][0]['message']['content'].strip()
    except Exception as e:
        print(f"Error during summarization: {e}")
        return None

def main():
    """Main function to preprocess and summarize a sample proposal."""
    # Sample DAO proposal text
    proposal_text = """
    This proposal aims to allocate 10% of the DAO's treasury to fund research on integrating AI-based governance mechanisms. 
    The goal is to automate proposal summarization, improve voting participation, and provide real-time insights. 
    The funds will be used for hiring researchers, developing prototypes, and deploying pilot solutions. 
    Benefits include increased efficiency, transparency, and scalability of the DAO governance process.
    """

    # Step 1: Preprocess the text
    cleaned_text = preprocess_text(proposal_text)
    print("Cleaned Text:")
    print(cleaned_text)

    # Step 2: Generate summary with OpenAI GPT-4-turbo API
    summary = summarize_text_with_openai(cleaned_text)
    if summary:
        print("\nGenerated Summary:")
        print(summary)

if __name__ == "__main__":
    main()
