from convokit import Corpus, download
from gensim import corpora, models
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import RegexpTokenizer
import spacy
from nltk.sentiment import SentimentIntensityAnalyzer
import os

# Initialize NLP tools
nlp = spacy.load("en_core_web_sm")
sia = SentimentIntensityAnalyzer()

# Define a function to download and load the dataset
def load_dataset(dataset_name="movie-corpus"):
    dataset_path = os.path.join(os.path.expanduser("~"), ".convokit", "downloads", dataset_name)
    if not os.path.exists(dataset_path):
        print("Downloading the dataset...")
        return Corpus(filename=download(dataset_name))
    else:
        print("Loading the dataset from", dataset_path)
        return Corpus(filename=dataset_path)

# Extract a sample of conversations from the dataset
def get_sample_contexts(corpus, max_samples=15):
    sample_contexts = []
    for convo in corpus.iter_conversations():
        conversation_text = " ".join(utterance.text for utterance in convo.iter_utterances())
        sample_contexts.append(conversation_text)
        if len(sample_contexts) >= max_samples:
            break
    return sample_contexts

# Named Entity Recognition using spaCy
def named_entity_recognition_spacy(text):
    doc = nlp(text)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    return entities

# Sentiment Analysis using VADER
def analyze_sentiment(text):
    return sia.polarity_scores(text)

# Prepare texts for LDA topic modeling
def prepare_texts(texts):
    tokenizer = RegexpTokenizer(r'\w+')
    stop_words = set(stopwords.words('english'))
    processed_texts = [
        [word for word in tokenizer.tokenize(context.lower()) if word not in stop_words]
        for context in texts
    ]
    return processed_texts

# Create LDA model for topic modeling
def create_lda_model(processed_texts, num_topics=5):
    dictionary = corpora.Dictionary(processed_texts)
    corpus = [dictionary.doc2bow(text) for text in processed_texts]
    ldamodel = models.ldamodel.LdaModel(corpus, num_topics=num_topics, id2word=dictionary, passes=15)
    return ldamodel

# Get topics from the LDA model
def get_topics(ldamodel, num_words=4):
    return ldamodel.print_topics(num_words=num_words)

# The following code is to run the module independently for testing
if __name__ == '__main__':
    # Load the dataset
    corpus = load_dataset()

    # Get a sample of conversations
    sample_contexts = get_sample_contexts(corpus)

    # Process the sample contexts
    processed_texts = prepare_texts(sample_contexts)
    ldamodel = create_lda_model(processed_texts)

    # Print named entities, sentiment, and topics for each context
    for context in sample_contexts:
        entities = named_entity_recognition_spacy(context)
        sentiment_score = analyze_sentiment(context)
        print("Conversation:", context)
        print("Named Entities:", entities)
        print("Sentiment:", sentiment_score)
        print("\n" + "-"*80 + "\n")

    topics = get_topics(ldamodel)
    for topic in topics:
        print("Topic:", topic)
