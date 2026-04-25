import numpy as np
from typing import Tuple


COLOUR_PALETTES = {

    'default': [
        [230, 25,  75 ],
        [60,  180, 75 ],
        [0,   130, 200],
        [245, 130, 48 ],
        [145, 30,  180],
        [70,  240, 240],
        [240, 50,  230],
        [210, 245, 60 ],
        [170, 110, 40 ],
        [128, 128, 128],
    ],

    'terrain': [
        [74,  124, 89 ],
        [139, 105, 20 ],
        [196, 163, 90 ],
        [112, 128, 144],
        [107, 142, 35 ],
        [160, 82,  45 ],
        [188, 143, 143],
        [46,  139, 87 ],
        [205, 192, 176],
        [47,  47,  47 ],
    ],

    'spectral': [
        [213, 62,  79 ],
        [244, 109, 67 ],
        [253, 174, 97 ],
        [254, 224, 139],
        [230, 245, 152],
        [171, 221, 164],
        [102, 194, 165],
        [50,  136, 189],
        [94,  79,  162],
        [158, 1,   66 ],
    ],

    'monochrome': [
        [20,  20,  20 ],
        [60,  60,  60 ],
        [100, 100, 100],
        [140, 140, 140],
        [170, 170, 170],
        [200, 200, 200],
        [220, 220, 220],
        [235, 235, 235],
        [245, 245, 245],
        [255, 255, 255],
    ],
}

DEFAULT_SCHEME = 'default'


def get_colours(n_clusters: int, scheme: str = 'default') -> list:
    if scheme not in COLOUR_PALETTES:
        scheme = DEFAULT_SCHEME
    palette = COLOUR_PALETTES[scheme]
    if n_clusters <= len(palette):
        return palette[:n_clusters]
    return _interpolate_colours(palette, n_clusters)


def _interpolate_colours(palette: list, n: int) -> list:
    palette_array = np.array(palette, dtype=float)
    result = []
    for i in range(n):
        position      = i / (n - 1) if n > 1 else 0.0
        segment_length = 1.0 / (len(palette) - 1)
        segment_index  = min(
            int(position / segment_length),
            len(palette) - 2
        )
        t = (position - segment_index * segment_length) / segment_length
        colour = (
            palette_array[segment_index] * (1 - t) +
            palette_array[segment_index + 1] * t
        )
        result.append(colour.astype(int).tolist())
    return result


def colourise(
    predictions: np.ndarray,
    n_clusters: int,
    scheme: str = 'default'
) -> Tuple[np.ndarray, dict]:
    colours   = get_colours(n_clusters, scheme)
    height, width = predictions.shape
    rgb_image = np.zeros((height, width, 3), dtype=np.uint8)
    for cluster_id, colour in enumerate(colours):
        mask = predictions == cluster_id
        rgb_image[mask] = colour
    colour_legend = _build_legend(colours)
    return rgb_image, colour_legend


def _build_legend(colours: list) -> dict:
    legend = {}
    for cluster_id, colour in enumerate(colours):
        r, g, b = colour[0], colour[1], colour[2]
        hex_colour = '#{:02x}{:02x}{:02x}'.format(r, g, b)
        legend[str(cluster_id)] = {
            'hex':   hex_colour,
            'rgb':   [r, g, b],
            'label': f'Cluster {cluster_id}',
        }
    return legend


def get_available_schemes() -> list:
    return list(COLOUR_PALETTES.keys())