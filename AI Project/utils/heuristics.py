import math
from typing import Dict, List
from utils.data import NODE_LOCATIONS, calculate_distance


def euclidean_distance(node1: str, node2: str) -> float:
    if node1 not in NODE_LOCATIONS or node2 not in NODE_LOCATIONS:
        return 0.0

    n1 = NODE_LOCATIONS[node1]
    n2 = NODE_LOCATIONS[node2]
    return calculate_distance(n1["lat"], n1["lng"], n2["lat"], n2["lng"])


def haversine_distance(node1: str, node2: str) -> float:
    return euclidean_distance(node1, node2)


def manhattan_distance(node1: str, node2: str) -> float:
    if node1 not in NODE_LOCATIONS or node2 not in NODE_LOCATIONS:
        return 0.0

    n1 = NODE_LOCATIONS[node1]
    n2 = NODE_LOCATIONS[node2]
    lat_diff = abs(n2["lat"] - n1["lat"])
    lng_diff = abs(n2["lng"] - n1["lng"])
    return (lat_diff + lng_diff) * 111.0


def get_heuristic(node: str, goal: str) -> float:
    return euclidean_distance(node, goal)


def get_all_heuristics(goal: str) -> Dict[str, float]:
    h = {}
    for node in NODE_LOCATIONS:
        h[node] = euclidean_distance(node, goal)
    return h
