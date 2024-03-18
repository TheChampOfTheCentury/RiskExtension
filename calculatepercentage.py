from random import randint

total_sims = 10000
# attacking does count the 1 troop that exists on the territory
attacking_territory = 21
defending_territories = [1] * 14 + []
print (sum(defending_territories))

def roll_dice():
    return randint(1,6)

def get_rolls(count):
    return sorted([roll_dice() for __ in range(count)], reverse=True)

def calculate_dice(attacker, defender):
    while attacker > 0 and defender > 0:
        attacker_dice = get_rolls(min(attacker, 3))
        defender_dice = get_rolls(min(defender, 2))

        # print ("rolls", attacker_dice, defender_dice, attacker, defender)

        for i in range(min(len(attacker_dice), len(defender_dice))):
            if (attacker_dice[i] > defender_dice[i]):
                defender -= 1
                if (defender == 0): break
            else:
                attacker -= 1
                if (attacker == 0): break

    return attacker

attacker_wins = 0

zzz = len(defending_territories)

import time
start = time.time()

for _ in range(0, total_sims):
    a = attacking_territory-1

    for j in range(zzz):
        a = calculate_dice(a, defending_territories[j])
        if (j != zzz-1):
            a -= 1

        if (a == 0):
            break

    if (a > 0):
        attacker_wins += 1


win_rate = round(attacker_wins/total_sims*100, 2)

print (f"attacker wins {win_rate}% of the time, defender wins {round(100-win_rate, 2)}% of the time")
print (f"took {round(time.time()-start, 2)} seconds")