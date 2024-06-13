from flask import Flask, jsonify, send_from_directory, render_template
import pandas as pd
import ast
from flask_cors import CORS


app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)


@app.route('/')
def _index():
    return render_template('index.html')


@app.route('/character-interaction')
def character_interaction():
   
    return send_from_directory(app.static_folder, 'character_interaction.html')

@app.route('/streamgraph')
def word_cloud():
  
    return send_from_directory(app.static_folder, 'streamgraph.html')


@app.route('/wordcloud')
def streamgraph():
  
    return send_from_directory(app.static_folder, 'word_cloud.html')


@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory(app.static_folder, path)

@app.route('/data/interactions')
def interactions_data():
    interactions_df = pd.read_csv('interactions.csv')
    # Convert the string representation of a list into an actual list
    interactions_df['speakers'] = interactions_df['speakers'].apply(ast.literal_eval)
    
    # Create nodes and links
    nodes = list({speaker for conversation in interactions_df['speakers'] for speaker in conversation})
    links = []
    for speakers_list in interactions_df['speakers']:
        for i in range(len(speakers_list) - 1):
            # Add a link for each pair of consecutive speakers
            links.append({'source': speakers_list[i], 'target': speakers_list[i + 1]})

    # Convert nodes to the required format
    nodes = [{'id': node} for node in nodes]
    return jsonify({'nodes': nodes, 'links': links})


@app.route('/data/movie-sentiment-stream')
def movie_sentiment_stream_data():
    # Read your cleaned data with sentiment scores
    df = pd.read_csv('cleaned_movie_dialogs.csv')

    # Group by movie_name and release_year (or another time unit), then calculate mean sentiment
    df_grouped = df.groupby(['movie_name', 'release_year'])['sentiment'].mean().reset_index()

    # Pivot the DataFrame to wide format
    df_wide = df_grouped.pivot(index='release_year', columns='movie_name', values='sentiment').fillna(0)

    # Convert the wide DataFrame to a format suitable for D3.js streamgraph
    data_for_streamgraph = df_wide.to_dict('list')
    data_for_streamgraph['release_year'] = df_wide.index.astype(str).tolist()  # Convert release years to strings

    return jsonify(data_for_streamgraph)

@app.route('/data/movie-ratings')
def movie_ratings_data():
    df = pd.read_csv('cleaned_movie_dialogs.csv')
    # Calculate average rating for each movie
    average_ratings = df.groupby('movie_name')['rating'].mean().reset_index()
    # Convert to dictionary
    ratings_dict = average_ratings.set_index('movie_name')['rating'].to_dict()
    return jsonify(ratings_dict)



if __name__ == '__main__':
    app.run(debug=True)
