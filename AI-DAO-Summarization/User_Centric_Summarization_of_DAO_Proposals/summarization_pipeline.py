import spacy
from transformers import pipeline

# Load spaCy model for preprocessing
nlp = spacy.load("en_core_web_sm")

# Load Hugging Face summarization pipeline
summarizer = pipeline("summarization", model="t5-base")


def preprocess_text(text):
    """Cleans and preprocesses input text using spaCy."""
    doc = nlp(text)
    sentences = [sent.text for sent in doc.sents if len(sent.text.strip()) > 10]  # Keep meaningful sentences
    return " ".join(sentences)


def summarize_text(text, max_length=100, min_length=30):
    """Generates a summary of the input text using Hugging Face's summarizer."""
    try:
        summary = summarizer(text, max_length=max_length, min_length=min_length, do_sample=False)
        return summary[0]['summary_text']
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

    # Step 2: Generate summary
    summary = summarize_text(cleaned_text)
    if summary:
        print("\nGenerated Summary:")
        print(summary)


if __name__ == "__main__":
    main()
