/**
 * DEMO FILE — this pull request is never merged.
 *
 * It exists to satisfy one acceptance criterion of #44: a pull request that breaks the code
 * style on purpose shows the `Code style` check red and cannot be merged.
 *
 * Deliberate violations, each reported by Biome:
 *   - formatting: double quotes instead of single, four-space indentation, a missing semicolon
 *   - lint/correctness/noUnusedVariables: `unused` is never read
 *   - lint/suspicious/noDoubleEquals: `==` instead of `===`
 *
 * `bun run check:style` reports the same three locally, which is the point of INFRA_09 R6.
 */
export function demo(value: string) {
    var unused = "never read"
    if (value == "thrive") {
        return "matched"
    }
    return "not matched"
}
