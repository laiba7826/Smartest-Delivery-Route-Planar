from typing import Dict, List, Optional
from utils.priority_queue import PriorityQueue
from utils.data import get_weighted_graph, GRAPH


def ucs(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    if options is None:
        options = []

    graph = get_weighted_graph(options) if options else GRAPH

    if start not in graph:
        return None

    pq = PriorityQueue()
    pq.push(start, 0)
    came_from = {start: None}
    cost_so_far = {start: 0}

    while not pq.is_empty():
        current = pq.pop()

        if current is None:
            break

        if current == goal:
            path = []
            node = goal
            while node is not None:
                path.append(node)
                node = came_from[node]
            path.reverse()
            return {"path": path, "total_dist": cost_so_far[goal], "algorithm": "ucs"}

        if current not in graph:
            continue

        neighbors = graph[current]
        for neighbor, weight in neighbors.items():
            new_cost = cost_so_far[current] + weight

            if neighbor not in cost_so_far or new_cost < cost_so_far[neighbor]:
                cost_so_far[neighbor] = new_cost
                pq.push(neighbor, new_cost)
                came_from[neighbor] = current

    return None


def search(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    return ucs(start, goal, options)
