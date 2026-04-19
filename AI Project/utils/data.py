import math
from typing import Dict, List, Tuple

NODE_LOCATIONS = {
    "A": {"lat": 24.9335, "lng": 67.1120, "name": "UIT University, Gulshan Block 7"},
    "B": {"lat": 24.9298, "lng": 67.1085, "name": "Gulshan Chowrangi"},
    "C": {"lat": 24.9215, "lng": 67.1020, "name": "NIPA Chowrangi"},
    "D": {"lat": 24.9145, "lng": 67.0920, "name": "Liaquatabad"},
    "E": {"lat": 24.9055, "lng": 67.0850, "name": "Teen Hatti"},
    "F": {"lat": 24.8940, "lng": 67.0800, "name": "Guru Mandir"},
    "G": {"lat": 24.8850, "lng": 67.0700, "name": "MA Jinnah Road"},
    "H": {"lat": 24.8607, "lng": 67.0011, "name": "Saddar Karachi"},
}

GRAPH = {
    "A": {"B": 0.5, "C": 1.2},
    "B": {"A": 0.5, "C": 0.7, "D": 1.5},
    "C": {"A": 1.2, "B": 0.7, "D": 0.9, "E": 1.4},
    "D": {"B": 1.5, "C": 0.9, "E": 0.8, "F": 1.6},
    "E": {"C": 1.4, "D": 0.8, "F": 1.1, "G": 1.8},
    "F": {"D": 1.6, "E": 1.1, "G": 1.3},
    "G": {"E": 1.8, "F": 1.3, "H": 5.2},
    "H": {"G": 5.2},
}

TRAFFIC_WEIGHTS = {
    "A": {"B": 1.0, "C": 1.0},
    "B": {"A": 1.0, "C": 1.3, "D": 1.8},
    "C": {"A": 1.0, "B": 1.3, "D": 1.2, "E": 1.5},
    "D": {"B": 1.8, "C": 1.2, "E": 1.0, "F": 2.0},
    "E": {"C": 1.5, "D": 1.0, "F": 1.1, "G": 1.6},
    "F": {"D": 2.0, "E": 1.1, "G": 1.0},
    "G": {"E": 1.6, "F": 1.0, "H": 2.5},
    "H": {"G": 2.5},
}

FUEL_WEIGHTS = {
    "A": {"B": 0.9, "C": 1.1},
    "B": {"A": 0.9, "C": 1.0, "D": 1.3},
    "C": {"A": 1.1, "B": 1.0, "D": 1.0, "E": 1.2},
    "D": {"B": 1.3, "C": 1.0, "E": 0.9, "F": 1.4},
    "E": {"C": 1.2, "D": 0.9, "F": 1.0, "G": 1.3},
    "F": {"D": 1.4, "E": 1.0, "G": 0.9},
    "G": {"E": 1.3, "F": 0.9, "H": 1.5},
    "H": {"G": 1.5},
}

ROAD_WEIGHTS = {
    "A": {"B": 1.0, "C": 1.3},
    "B": {"A": 1.0, "C": 1.0, "D": 1.5},
    "C": {"A": 1.3, "B": 1.0, "D": 1.0, "E": 1.2},
    "D": {"B": 1.5, "C": 1.0, "E": 0.9, "F": 1.6},
    "E": {"C": 1.2, "D": 0.9, "F": 1.0, "G": 1.4},
    "F": {"D": 1.6, "E": 1.0, "G": 0.9},
    "G": {"E": 1.4, "F": 0.9, "H": 2.0},
    "H": {"G": 2.0},
}


def get_weighted_graph(options: List[str]) -> Dict[str, Dict[str, float]]:
    if not options:
        return GRAPH

    weighted = {}
    nodes = list(GRAPH.keys())

    for node in nodes:
        weighted[node] = {}
        for neighbor, base_dist in GRAPH[node].items():
            weight = base_dist

            if (
                "traffic" in options
                and node in TRAFFIC_WEIGHTS
                and neighbor in TRAFFIC_WEIGHTS[node]
            ):
                weight *= TRAFFIC_WEIGHTS[node][neighbor]

            if (
                "fuel" in options
                and node in FUEL_WEIGHTS
                and neighbor in FUEL_WEIGHTS[node]
            ):
                weight *= FUEL_WEIGHTS[node][neighbor]

            if (
                "roads" in options
                and node in ROAD_WEIGHTS
                and neighbor in ROAD_WEIGHTS[node]
            ):
                weight *= ROAD_WEIGHTS[node][neighbor]

            weighted[node][neighbor] = weight

    return weighted


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_heuristic(node: str, goal: str) -> float:
    if node not in NODE_LOCATIONS or goal not in NODE_LOCATIONS:
        return 0.0

    n1 = NODE_LOCATIONS[node]
    n2 = NODE_LOCATIONS[goal]
    return calculate_distance(n1["lat"], n1["lng"], n2["lat"], n2["lng"])


def get_all_nodes() -> List[str]:
    return list(NODE_LOCATIONS.keys())


def get_neighbors(node: str) -> Dict[str, float]:
    return GRAPH.get(node, {})
