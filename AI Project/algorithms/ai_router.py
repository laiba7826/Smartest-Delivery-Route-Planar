from typing import Dict, List, Optional
from algorithms.bfs import search as bfs_search
from algorithms.ucs import search as ucs_search
from algorithms.astar import search as astar_search
from utils.data import get_weighted_graph, GRAPH


def select_best_algorithm(options: List[str], start: str, end: str) -> str:
    """
    AI-powered algorithm selection based on user preferences.

    Selection logic:
    - Less Traffic: BFS explores broadly to find alternate routes avoiding congested areas
    - Fuel Efficient: UCS finds optimal cost path (minimizes fuel consumption)
    - Better Roads: A* with road quality weights finds smoothest route
    - Multiple Options: A* combines all factors optimally
    - Default/Quick: A* is fastest and most accurate
    """
    if not options:
        return "astar"

    traffic = "traffic" in options
    fuel = "fuel" in options
    roads = "roads" in options
    option_count = sum([traffic, fuel, roads])

    if option_count == 1:
        if traffic:
            return "bfs"
        elif fuel:
            return "ucs"
        elif roads:
            return "astar"

    if option_count >= 2:
        return "astar"

    return "astar"


def get_algorithm_reason(options: List[str], algorithm: str) -> str:
    """Generate human-readable reason for algorithm selection."""
    if not options:
        return f"Using {algorithm.upper()} for fastest optimal path"

    traffic = "traffic" in options
    fuel = "fuel" in options
    roads = "roads" in options

    if algorithm == "bfs":
        return "BFS finds alternate routes avoiding high-traffic areas"
    elif algorithm == "ucs":
        return "Uniform Cost Search minimizes total travel cost"
    elif algorithm == "astar":
        reasons = []
        if traffic:
            reasons.append("traffic")
        if fuel:
            reasons.append("fuel")
        if roads:
            reasons.append("road quality")
        return f"A* optimized for {', '.join(reasons)}"

    return f"Using {algorithm.upper()} for optimal routing"


def ai_route(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    """
    AI-powered route planning that automatically selects the best algorithm
    based on user preferences (less traffic, fuel efficient, better roads).
    """
    if options is None:
        options = []

    algorithm = select_best_algorithm(options, start, goal)

    result = None

    if algorithm == "bfs":
        result = bfs_search(start, goal, options)
    elif algorithm == "ucs":
        result = ucs_search(start, goal, options)
    elif algorithm == "astar":
        result = astar_search(start, goal, options)
    else:
        result = astar_search(start, goal, options)

    if result and result.get("path"):
        result["algorithm"] = algorithm
        result["reason"] = get_algorithm_reason(options, algorithm)
        result["ai_selected"] = True

    return result


def search(start: str, goal: str, options: List[str] = None) -> Optional[Dict]:
    """Main entry point for AI-powered route search."""
    return ai_route(start, goal, options)


def compare_all_algorithms(start: str, goal: str, options: List[str] = None) -> Dict:
    """
    Run all algorithms and return comparison results.
    Useful for analytics and validation.
    """
    results = {}

    algorithms = [
        ("astar", astar_search),
        ("bfs", bfs_search),
        ("ucs", ucs_search),
    ]

    for name, func in algorithms:
        result = func(start, goal, options)
        if result and result.get("path"):
            results[name] = {
                "path": result["path"],
                "distance": result["total_dist"],
                "stops": len(result["path"]),
            }

    return results
