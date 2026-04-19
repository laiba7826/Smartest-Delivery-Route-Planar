from typing import Dict, List, Tuple, Optional
from collections import deque
from utils.data import get_weighted_graph, GRAPH


def bfs(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    if options is None:
        options = []

    graph = get_weighted_graph(options) if options else GRAPH

    if start not in graph:
        return None

    queue = deque([(start, [start], 0)])
    visited = {start}

    while queue:
        node, path, cost = queue.popleft()

        if node == goal:
            return {"path": path, "total_dist": cost, "algorithm": "bfs"}

        if node not in graph:
            continue

        neighbors = graph[node]
        for neighbor in sorted(neighbors.keys()):
            if neighbor not in visited:
                visited.add(neighbor)
                new_cost = cost + neighbors[neighbor]
                queue.append((neighbor, path + [neighbor], new_cost))

    return None


def search(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    return bfs(start, goal, options)
