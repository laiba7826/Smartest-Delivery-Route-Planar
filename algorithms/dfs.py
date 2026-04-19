from typing import Dict, List, Tuple, Optional
from utils.data import get_weighted_graph, GRAPH


def dfs(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    if options is None:
        options = []

    graph = get_weighted_graph(options) if options else GRAPH

    if start not in graph:
        return None

    stack = [(start, [start], 0)]
    visited = {start}

    while stack:
        node, path, cost = stack.pop()

        if node == goal:
            return {"path": path, "total_dist": cost, "algorithm": "dfs"}

        if node not in graph:
            continue

        neighbors = graph[node]
        for neighbor in sorted(neighbors.keys(), key=lambda x: -neighbors[x]):
            if neighbor not in visited:
                visited.add(neighbor)
                new_cost = cost + neighbors[neighbor]
                stack.append((neighbor, path + [neighbor], new_cost))

    return None


def search(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    return dfs(start, goal, options)
