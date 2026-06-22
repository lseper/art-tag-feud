import requests as re
import json
import time
from functools import reduce

def progressBar(iterable, prefix = '', suffix = '', decimals = 1, length = 100, fill = '█', printEnd = "\r"):
    """
    Call in a loop to create terminal progress bar
    @params:
        iterable    - Required  : iterable object (Iterable)
        prefix      - Optional  : prefix string (Str)
        suffix      - Optional  : suffix string (Str)
        decimals    - Optional  : positive number of decimals in percent complete (Int)
        length      - Optional  : character length of bar (Int)
        fill        - Optional  : bar fill character (Str)
        printEnd    - Optional  : end character (e.g. "\r", "\r\n") (Str)
    @author Greenstick on Stackoverflow
    """
    total = len(iterable)
    # Progress Bar Printing Function
    def printProgressBar (iteration):
        percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
        filledLength = int(length * iteration // total)
        bar = fill * filledLength + '-' * (length - filledLength)
        print(f'\r{prefix} |{bar}| {percent}% {suffix}', end = printEnd)
    # Initial Call
    printProgressBar(0)
    # Update Progress Bar
    for i, item in enumerate(iterable):
        yield item
        printProgressBar(i + 1)
    # Print New Line on Complete
    print()



ERR_CODE = 503
PAGE_LIMIT = 1000
# how many posts needed to be tagged with the tags to show up on the game. Filters out obscure / unknown tags
GENERAL_COUNT_THRESHOLD = 1000
SPECIES_COUNT_THRESHOLD = 200
BASE_URL = 'https://e621.net/tags.json?&search[category]=0&search[order]=count'
HEADERS = {'user-agent' : "Zaverose"}

# const OCCURRENCE_MEAN = tag_number_data.reduce((p, c) => p + c.count, 0) / tag_number_data.length;
# const OCCURRENCE_STD = Math.sqrt(tag_number_data.map((e) => (e.count - OCCURRENCE_MEAN) ** 2).reduce((p, c) => p + c, 0)) / tag_number_data.length;

# const SCORE_MEAN = 50;
# const SCORE_STD = 50;

def z_score(x, mean, std):
    return (x - mean) / std

# Really the only two that will have varying scores
TAG_CATEGORIES = {"general" : 0, "species" : 5}
SCORE_MEAN = 50
# Wide STD due to there being a significantly large standard deviation. Should probably use something other than normal dist for this
# then. Look into maybe using an exponential decay of some kind
SCORE_STD = 400
MIN_SPECIES_SCORE = 20
MIN_GENERAL_SCORE = 3

def refreshTags(s_category):
    category = TAG_CATEGORIES[s_category]
    count_mean = 0
    fetched = []
    with open(f"tag-data-{s_category}.json", 'w') as f:
        temp = getTags(category, 1)
        temp = temp if temp != ERR_CODE else []
        fetched.extend(temp)
        if len(fetched) == 0:
            print("fUck something went wrong :(")
            return  
        time.sleep(3) 
        # sentinel to catch any absurd errors
        page = 2
        while True and page < PAGE_LIMIT:
            data = getTags(category, page)
            if data == ERR_CODE:
                print("something went wrong after the initial request :(")
                break
            if not data:
                print("final tag retrieved, nothing left to store")
                break
            temp_sum = sum([x["count"] for x in data])
            count_mean += temp_sum
            # get the tag aliases for the data
            fetched.extend(data)
            # sentinel to catch any absurd errors
            page += 1
            # don't exceed request limit
            time.sleep(3)
        count_mean /= len(fetched)
        count_std = (sum([(entry["count"] - count_mean) ** 2 for entry in fetched]) / len(fetched)) ** 0.5
        min_possible_score = MIN_GENERAL_SCORE if s_category == "general" else MIN_SPECIES_SCORE
        fetched = input_scores(fetched, count_mean, count_std, min_possible_score)
        # store the data
        json.dump(fetched, f)
    with open(f"{s_category}_tag-meta-data.json", 'w') as f:
        json.dump({f"{s_category}_occurrences_mean": count_mean, f"{s_category}_occurrences_std": count_std, 
        f"{s_category}_max_score" : max([x["score"] for x in fetched]), f"{s_category}_min_score" : min([x["score"] for x in fetched])}, f)
    print("Finished")

def input_scores(data, mean, std, min_score):
    for i in range(len(data)):
        curr = data[i]
        # normalize scores to a normal disrtibution with a mean of 50, std of 50
        z_score_val = z_score(curr["count"], mean, std)
        # compute the score (-1 * z_score_val) done so that lower amount tags are worth more (harder to guess)
        score_val = ((-1 * z_score_val) * SCORE_STD) + SCORE_MEAN + min_score
        curr["score"] = int(score_val) if score_val > min_score else min_score
    return data

def getTags(category, page):
    '''Gets tags from the upper bound down'''
    url = f'https://e621.net/tags.json?&search[category]={category}&search[order]=count&page={page}'
    print(url)
    response = re.get(url, headers=HEADERS)
    if response.status_code == 200:
        json = response.json()
        # we've exhausted the responses (this is if the resposne is successful, but empty)
        json = adequateCount(json, category)
        # make sure it is a list, not False, which is returned when no tags are >= post limit
        if json:   
            return filter_tag_counts(json)
        return json
    else:
        print(f"Status code: {response.status_code}")
        return ERR_CODE

def filter_tag_counts(data):
    '''gets only the tag count from each of the tags'''
    return [{"name" : item['name'], "count" : item['post_count']} for item in data]

def getAllTagAliases(category):
    '''gets all of the aliases for the tags within tag-data.json'''
    alias_map = {}
    with open("tag-data.json", "r") as f:
        data = json.load(f)
        for item in progressBar(data, prefix="Alias Fetch Progress:", suffix="Complete", length = 40):
            name = item["name"]
            # print(f'\tfetching aliases for: {name}')
            aliases = getTagAliases(category, name)
            if len(aliases) > 0:
                alias_map.update(aliases)
            # else:
            #     print(f"\tNo aliases found for: {name}")
            time.sleep(2)
    with open("tag-aliases.json", "w") as f:
        json.dump(alias_map, f)
    print("Finished!")
        
def getTagAliases(category, original_tag):
    '''gets the tags that this one is aliased to'''
    url = f'https://e621.net/tag_aliases.json?&search[category]={category}&search[order]=tag_count&search[name_matches]={original_tag}'
    response = re.get(url, headers=HEADERS)
    if response.status_code == 200:
        json = response.json()
        # non-empty response
        if len(json) > 1:
            mapped_aliases = {}
            for item in json:
                mapped_aliases[item['antecedent_name']] = original_tag
            return mapped_aliases
        # successful, but no aliases to store
        return {}
    print(f"Something went wrong with the request. Status code: {response.status_code}")
    return {}

def adequateCount(data, category):
    if category == 0:
        threshold = GENERAL_COUNT_THRESHOLD
    else:
        threshold = SPECIES_COUNT_THRESHOLD
    if data[-1]['post_count'] < threshold:
        print(f"\t{data[-1]['post_count']} is insufficient, searching for one with {threshold} posts or above")
        # iterate backwards through the tags
        for i in range(len(data) - 1, -1, -1):
            print(f"\t\t{data[i]['post_count']}")
            # once you've found a tag with an adequate amount of posts, return that slice of the list and exit
            if data[i]['post_count'] >= threshold:
                return data[:i + 1]
        # somehow none of them were enough? this should rarely happen
        return False
    print(f"\tlowest count -- {data[-1]['post_count']}")
    return data

# general tags
# refreshTags(0)
# species tags
# test = getTagAliases(0, "male")
# print(test)

# ---- ACTUAL CODE TO RUN ------
# --- FETCHING TAG DATA (NOT ALIASES) ----
# refreshTags("general")
# refreshTags("species")
# getAllTagAliases(0)

