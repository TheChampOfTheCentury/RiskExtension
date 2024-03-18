const styles = `
    .chainline-node {
        width: 12px;
        height: 12px;
        font-weight: 800;
        font-size: 25px;
        display: absolute;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        line-height:0px;
        text-shadow: 0.4px 0 #000, -0.4px 0 #000, 0 0.4px #000, 0 -0.4px #000;
        filter: blur(0.4px);
    }

    .chainline-node-init {
        color: gray;
    }

    .chainline-node-attacker {
        color: red;
    }

    .chainline-node-adjacent {
        color: gray;
    }

    .chainline-node-adjacent-nomove {
        color: slategray;
    }

    .chainline-node-defender {
        color: blue;
    }

    .chainline-node-spare {
        color: magenta;
    }

    .chainline-winrate-text {
        color: gold;
        font-weight: 500;
        cursor: default;
        position: absolute;
    }

    .chainline-field-input {
        height: 20px;
        padding: 0;
        min-width: 0;
        width: 50px;
    }
`


// settings
const total_sims = 10000;

function style() {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}


// memory
let attacker = {}; // { t: .js_territory, n: int }
// because yes, easiest way to keep a ref while still being lazy
// doesnt affect performance a bit, just makes the code a leel wonk

let leash = []; // { t: .js_territory, spare: boolean }


function node_to_terr(node) {
    return node.parentNode.querySelector('.js_territory')
}

function terr_to_node(t) {
    return t.parentNode.querySelector('.chainline-node')
}

function remove_elements(clazz) {
    document.querySelectorAll(`.${clazz}`).forEach(e => e.remove());
}

function terr_to_int(t) {
    return parseInt(t.innerText.replace(" ", ""));
}

function get_adjacent_ids(t) {
    return t.getAttribute("data-adjacencies").split(",")
}

function leash_to_territories() {
    const territories = [];
    for (const group of leash) {
        territories.push(group.t)
    }
    return territories
}



function create_init_chain_node(t, parent) {
    const node = document.createElement("div");
    node.classList.add('chainline', 'chainline-node', 'chainline-node-init');
    node.innerText = '\u002b';
    node.onclick = () => { init_node_clicked(node, t); }
    parent.appendChild(node);
}

function create_adjacent_chain_node(adj_t) {
    const node = document.createElement("div");
    node.classList.add('chainline', 'chainline-node', 'chainline-node-adjacent');
    node.innerText = '\u00d7';
    node.onclick = (event) => { adjacent_node_clicked(node, adj_t, event.altKey); }
    adj_t.parentNode.appendChild(node);
}

function create_winrate_node(parent) {
    const d = [];
    const e = [];

    for (let _d = 0; _d < leash.length; _d++) {
        const group = leash[_d];
        d.push(terr_to_int(group.t))
        if (group.spare) e.push(_d)
    }

    const winrate = calculate_percentage(attacker.n, d, e)
    const winrate_node = document.createElement('div')
    winrate_node.innerText = `${winrate}%`;
    winrate_node.classList.add('chainline-winrate-text')
    parent.appendChild(winrate_node)
}

function add_attacker_input(parent, initial_value) {
    const field = document.createElement("input");
    field.setAttribute("type", "number")
    field.setAttribute("min", "1")
    // field.setAttribute("max", "998")
    field.setAttribute("value", initial_value)
    field.classList.add("chainline", "chainline-field", "chainline-field-input")

    // const update_button = document.createElement("button");
    // update_button.classList.add("chainline", "chainline-field", "chainline-field-update")

    field.onchange = (event) => {
        const r = event.target.value
        if (r != "" && !isNaN(r)) {
            attacker = { t: attacker.t, n: parseInt(r) }
            remove_elements('chainline-winrate-text')
            if (leash.length > 0) {
                create_winrate_node(leash[leash.length - 1].t.parentNode)
            }
        }
    }

    parent.appendChild(field)
    // parent.appendChild(update_button)
}

function init_node_clicked(node, t) {
    if (Object.keys(attacker).length === 0) { // leash is not active, create leash
        node.classList.remove('chainline-node-init')
        node.classList.add('chainline-node-attacker')

        // create input box
        const n = terr_to_int(t)

        add_attacker_input(t.parentNode, n)

        attacker = { t: t, n: n }

        // remove other init nodes
        remove_elements('chainline-node-init')

        // create adjacent nodes
        place_adjacent_nodes(get_adjacent_ids(attacker.t))

    } else { // end leash
        remove_elements('chainline')
        init_nodes()
        // its cheap but it works lol
        attacker = {}

        leash.length = 0;
        clear_leash()
        remove_elements('chainline-winrate-text')
    }
}

function adjacent_node_clicked(node, adj_t, isSpare) {
    const z = leash_to_territories(leash);
    if (z.includes(adj_t)) { // splice leash from this point since its a defender
        const i = z.indexOf(adj_t);
        // remove items from leash
        for (let p = i; p < leash.length; p++) {
            const leash_defender_node = terr_to_node(leash[p].t); // { t: .js_territory, spare: boolean }
            leash_defender_node.remove() // remove node
        }

        node.classList.remove('chainline-node-adjacent')

        remove_elements('chainline-winrate-text')
        leash = leash.splice(0, i)
        if (leash.length > 0) {
            create_winrate_node(leash[leash.length - 1].t.parentNode)
        }

    } else { // user wants to add to leash
        leash.push({ t: adj_t, spare: isSpare })

        // set to defender and remove previous
        node.classList.remove('chainline-node-adjacent')
        if (isSpare) {
            node.classList.add('chainline-node-spare')
        } else {
            node.classList.add('chainline-node-defender')
        }
        remove_elements('chainline-winrate-text')
        create_winrate_node(adj_t.parentNode)
    }

    // remove previous if not a spare
    if (!isSpare) {
        remove_elements('chainline-node-adjacent')

        // place new adjacent nodes
        if (leash.length == 0) { // place at attacker
            place_adjacent_nodes(get_adjacent_ids(attacker.t))
        } else { // place at latest defender
            place_adjacent_nodes(get_adjacent_ids(leash[leash.length - 1].t))
        }
    }

    clear_leash()
    draw_leash()
}



function place_adjacent_nodes(adjacent_territory_ids) {
    for (let territory_id of adjacent_territory_ids) {
        const adj_t = document.getElementById(`territory-${territory_id}`)
        if (adj_t && attacker.t != adj_t && !leash_to_territories(leash).includes(adj_t)) {
            create_adjacent_chain_node(adj_t)
        }
    }
}

function init_nodes() {
    const territories = document.querySelectorAll('.js_territory')

    for (let t of territories) {
        create_init_chain_node(t, t.parentNode)
    }
}



// roll a dice
function roll_dice() {
    // min inclusive, max exclusive
    return Math.round(Math.random() * (6 - 1) + 1);
}

// get a descending-sorted array of dice for easier comparison
function get_rolls(count) {
    const dice = []
    for (let i = 0; i < count; i++) {
        dice.push(roll_dice())
    }
    return dice.sort((a, b) => b - a);
}

// loop till attacker or defender lose and return remaining attackers so it can be chained
function calculate_dice(attacker, defender) {
    while (attacker > 0 && defender > 0) {
        let attacker_dice = get_rolls(Math.min(attacker, 3))
        let defender_dice = get_rolls(Math.min(defender, 2))

        const x = Math.min(attacker_dice.length, defender_dice.length)

        for (let i = 0; i < x; i++) {
            if (attacker_dice[i] > defender_dice[i]) {
                defender -= 1
                if (defender == 0) break
            } else {
                attacker -= 1
                if (attacker == 0) break
            }
        }
    }
    return attacker
}

// calculate chance of victory
function calculate_percentage(a, d, e) {
    let attacker_wins = 0;

    let calculated_sims = total_sims
    if (d.length > 8) {
        calculated_sims = total_sims - Math.min(d.length * 100, 5000);
    }

    let remainders = []

    for (let sim = 0; sim < calculated_sims; sim++) {
        let _a = a - 1 // because cannot attack on 1
        remainders.push([])
        for (let _d = 0; _d < d.length; _d++) {
            _a = calculate_dice(_a, d[_d])
            remainders[sim].push(_a)

            if (_d != d.length - 1) _a -= 1
            if (_a < 1) break
        }
        if (_a > 0) {
            attacker_wins += 1
        }
    }

    console.log("finished", attacker_wins, "for", Math.round(attacker_wins / calculated_sims * 100), "in sims:", calculated_sims, a, d, remainders.slice(0, 3))
    return Math.round(attacker_wins / calculated_sims * 100) // rounded percentage
}


function clear_leash() {
    const canvas = document.getElementById("map-canvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// draw leash
function draw_leash() {
    const points = [];
    // [{p1: [0, 0], p2: [0, 0], color: 'blue'}]

    // create points
    let a;
    for (let g = 0; g < leash.length; g++) {
        const group = leash[g];
        const b = { x: parseInt(group.t.getAttribute("data-x")) + 6, y: parseInt(group.t.getAttribute("data-y")) + 35 };

        if (a == undefined) { // initial attacker line
            points.push({
                p1: { x: parseInt(attacker.t.getAttribute("data-x")) + 6, y: parseInt(attacker.t.getAttribute("data-y")) + 35 },
                p2: b,
                color: group.spare ? 'yellow' : 'black'
            })
        } else { // defender to defender line
            points.push({
                p1: a,
                p2: b,
                color: group.spare ? 'yellow' : 'black'
            })
        }
        if (!group.spare) a = b;
    }


    const canvas = document.getElementById("map-canvas");
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;

    for (const point_group of points) {

        const p1 = point_group.p1;
        const p2 = point_group.p2;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = point_group.color;
        ctx.stroke();
    }
}




// start
style()
init_nodes()





