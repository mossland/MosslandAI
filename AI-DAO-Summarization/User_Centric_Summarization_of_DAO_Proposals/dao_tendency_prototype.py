import os
import json
import openai
from collections import defaultdict

# Set your OpenAI API key from the environment variable or assign it directly.
openai.api_key = os.getenv("OPENAI_API_KEY")
# Alternatively, uncomment and set your key directly:
# openai.api_key = "your-api-key-here"

class UserTendencyAnalyzer:
    def __init__(self, survey_responses=None, activity_data=None, opinions=None):
        """
        Initialize the analyzer with survey responses, activity data, and opinions.

        Args:
            survey_responses (dict): Survey data. Example:
                {
                    'risk_tolerance': 5,  # Scale 1 (very low) to 5 (very high); higher value implies more progressive
                    'community_value': 4, # Scale 1 to 5; higher value implies more social
                    'time_horizon': 2     # Scale 1 to 5; lower value implies short-term preference
                }
            activity_data (list of dict): Historical activity data (e.g., voting records). Example:
                {
                    'proposal_tags': ['innovative', 'investment', 'long-term'],
                    'vote': 'yes'
                }
            opinions (list of str): User opinions from forums, social media, etc.
        """
        self.survey_responses = survey_responses if survey_responses is not None else {}
        self.activity_data = activity_data if activity_data is not None else []
        self.opinions = opinions if opinions is not None else []

    def analyze_survey(self):
        """
        Analyze survey responses by normalizing the values (scale 1-5 to 0-1).
        - A higher 'risk_tolerance' implies a more progressive tendency.
        - A higher 'community_value' implies a more social tendency.
        - A higher 'time_horizon' implies a longer-term preference.
        """
        # Default values are set to 3 if missing.
        risk = self.survey_responses.get('risk_tolerance', 3)
        community = self.survey_responses.get('community_value', 3)
        time_horizon = self.survey_responses.get('time_horizon', 3)

        # Normalize scores: (value - 1) / 4 yields a range between 0 and 1.
        progressive_score = (risk - 1) / 4  # Higher value means more progressive.
        conservative_score = 1 - progressive_score

        social_score = (community - 1) / 4    # Higher value means more social.
        economic_score = 1 - social_score

        long_term_score = (time_horizon - 1) / 4  # Higher value means long-term.
        short_term_score = 1 - long_term_score

        return {
            'progressive': progressive_score,
            'conservative': conservative_score,
            'social': social_score,
            'economic': economic_score,
            'long_term': long_term_score,
            'short_term': short_term_score
        }

    def analyze_activity(self):
        """
        Analyze historical activity (voting records) by checking proposal tags.
        Only 'yes' votes are considered. The tags are mapped to corresponding tendency dimensions.
        """
        # Define sets of tags for each tendency.
        progressive_tags = set(['innovative', 'change', 'modern'])
        conservative_tags = set(['traditional', 'stability', 'conservative'])
        economic_tags = set(['profit', 'economic', 'investment'])
        social_tags = set(['community', 'social', 'public'])
        short_term_tags = set(['quick', 'immediate', 'short-term'])
        long_term_tags = set(['sustainable', 'future', 'long-term'])

        counts = defaultdict(int)
        counts['total'] = 0

        # Loop through each activity record.
        for vote in self.activity_data:
            # Consider only records with 'yes' votes.
            if vote.get('vote', '').lower() != 'yes':
                continue
            counts['total'] += 1
            tags = vote.get('proposal_tags', [])
            for tag in tags:
                tag_lower = tag.lower()
                if tag_lower in progressive_tags:
                    counts['progressive'] += 1
                if tag_lower in conservative_tags:
                    counts['conservative'] += 1
                if tag_lower in economic_tags:
                    counts['economic'] += 1
                if tag_lower in social_tags:
                    counts['social'] += 1
                if tag_lower in short_term_tags:
                    counts['short_term'] += 1
                if tag_lower in long_term_tags:
                    counts['long_term'] += 1

        if counts['total'] == 0:
            return None

        # Calculate the ratio for each dimension.
        prog_total = counts['progressive'] + counts['conservative'] + 1e-5
        economic_total = counts['economic'] + counts['social'] + 1e-5
        time_total = counts['short_term'] + counts['long_term'] + 1e-5

        progressive_score = counts['progressive'] / prog_total
        conservative_score = counts['conservative'] / prog_total
        economic_score = counts['economic'] / economic_total
        social_score = counts['social'] / economic_total
        short_term_score = counts['short_term'] / time_total
        long_term_score = counts['long_term'] / time_total

        return {
            'progressive': progressive_score,
            'conservative': conservative_score,
            'economic': economic_score,
            'social': social_score,
            'long_term': long_term_score,
            'short_term': short_term_score
        }

    def analyze_opinions_openai(self):
        """
        Use OpenAI's ChatCompletion API (with model "gpt-4") to analyze user opinions.
        The API prompt instructs the model to output a JSON object with scores for:
            - progressive vs conservative,
            - economic vs social,
            - long_term vs short_term.
        Each score is a value between 0 and 1, with the pair's scores summing to 1.
        """
        if not self.opinions:
            return None

        # Combine all opinions into a single text block.
        opinions_text = "\n".join(self.opinions)
        prompt = (
            "The following are user opinions related to DAO governance. "
            "Analyze the text and determine the user's tendencies on the following dimensions: "
            "progressive vs conservative, economic vs social, long_term vs short_term. "
            "For each dimension, output a score between 0 and 1, where the two scores in each pair sum to 1. "
            "For example, if progressive is 0.7 then conservative must be 0.3; if economic is 0.4 then social is 0.6; "
            "if long_term is 0.8 then short_term is 0.2. "
            "Text:\n'''\n" + opinions_text + "\n'''\n"
            "Please output the result in JSON format as follows:\n"
            '{"progressive": 0.7, "conservative": 0.3, "economic": 0.4, "social": 0.6, "long_term": 0.8, "short_term": 0.2}'
        )
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",  # Use the valid model identifier "gpt-4"
                messages=[
                    {"role": "system", "content": "You are an expert assistant analyzing user opinions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                max_tokens=150
            )
            content = response['choices'][0]['message']['content']
            result = json.loads(content)
            return result
        except Exception as e:
            print("Error during OpenAI API call:", e)
            return None

    def aggregate_tendencies(self):
        """
        Aggregate the results from the survey, activity, and opinion analyses
        by computing the average score for each tendency dimension (if data is available).
        """
        survey = self.analyze_survey()
        activity = self.analyze_activity()
        opinions = self.analyze_opinions_openai()

        aggregated = {}
        dimensions = ['progressive', 'conservative', 'economic', 'social', 'long_term', 'short_term']
        for dim in dimensions:
            scores = []
            if survey and (dim in survey):
                scores.append(survey[dim])
            if activity and (dim in activity):
                scores.append(activity[dim])
            if opinions and (dim in opinions):
                scores.append(opinions[dim])
            aggregated[dim] = sum(scores) / len(scores) if scores else None

        return aggregated

def simulate_virtual_user():
    """
    Simulate a virtual user scenario for a DAO member "Alice".
    
    1. Survey responses:
       - Risk tolerance: 5 (very high, indicating a progressive tendency)
       - Community value: 4 (high, indicating a social tendency)
       - Time horizon: 2 (low, indicating a short-term preference)
    
    2. Historical activity:
       - A series of proposals with 'yes' votes containing tags for various tendencies.
    
    3. User opinions:
       - Opinions provided by Alice via forums and social media.
    """
    survey_data = {
        'risk_tolerance': 5,      # Very high -> progressive tendency
        'community_value': 4,     # High -> social tendency
        'time_horizon': 2         # Low -> short-term preference
    }

    activity_data = [
        {'proposal_tags': ['innovative', 'investment', 'long-term'], 'vote': 'yes'},
        {'proposal_tags': ['traditional', 'economic', 'short-term'], 'vote': 'yes'},
        {'proposal_tags': ['innovative', 'social', 'long-term'], 'vote': 'yes'},
        {'proposal_tags': ['traditional', 'public', 'short-term'], 'vote': 'no'},  # 'no' vote is excluded
        {'proposal_tags': ['modern', 'investment', 'future'], 'vote': 'yes'},
    ]

    opinions = [
        "I strongly support innovative ideas and disruptive technologies that push our DAO forward. Embracing change is key to progress.",
        "However, I also value stability and tradition as they provide safety and continuity for the community.",
        "I prefer actionable plans that yield immediate results, yet I recognize the importance of long-term sustainability.",
        "Economic growth is essential, but the welfare of the community should not be overlooked."
    ]

    return survey_data, activity_data, opinions

if __name__ == "__main__":
    # Simulate the virtual user scenario for DAO member "Alice"
    survey_data, activity_data, opinions = simulate_virtual_user()

    analyzer = UserTendencyAnalyzer(
        survey_responses=survey_data,
        activity_data=activity_data,
        opinions=opinions
    )
    
    aggregated_profile = analyzer.aggregate_tendencies()

    print("=== Aggregated Tendency Profile for Alice ===")
    if aggregated_profile:
        for key, value in aggregated_profile.items():
            print(f"{key}: {value:.2f}")
    else:
        print("No analysis results available.")
