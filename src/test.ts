import { Collection } from "discord.js";

interface obj {
    value: string;
}

const t: Collection<number, obj> = new Collection(); 

(() => {
    t.set(0, { value: "hey" });

    const gotem = t.get(0)!;

    gotem.value = "hello there";

    const test = t.get(0)!;

    console.log(gotem);
    console.log(test);
})();