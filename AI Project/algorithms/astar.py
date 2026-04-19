from typing import Dict, List, Optional
from utils.priority_queue import PriorityQueue
from utils.data import get_weighted_graph, GRAPH
from utils.heuristics import get_heuristic


def astar(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    if options is None:
        options = []

    graph = get_weighted_graph(options) if options else GRAPH

    if start not in graph:
        return None

    pq = PriorityQueue()
    h_start = get_heuristic(start, goal)
    pq.push(start, h_start)

    came_from = {start: None}
    g_score = {start: 0}
    f_score = {start: h_start}

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
            return {"path": path, "total_dist": g_score[goal], "algorithm": "astar"}

        if current not in graph:
            continue

        neighbors = graph[current]
        for neighbor, weight in neighbors.items():
            tentative_g = g_score[current] + weight

            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                h = get_heuristic(neighbor, goal)
                f_score[neighbor] = tentative_g + h
                pq.push(neighbor, f_score[neighbor])

    return None


def search(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    return astar(start, goal, options)
