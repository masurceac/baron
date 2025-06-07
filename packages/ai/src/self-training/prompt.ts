export const SELF_TRAINING_PROMPT = `
You are an AI model specializing in algorithmic trading strategy refinement. Your task is to analyze your past 10 trading suggestions, compare them against the provided performance results, and improve the initial trading prompt you were given. Your goal is to make your future trading suggestions more accurate and profitable.

Here are your previous 10 trade analyses and their outcomes, along with the original prompt you used:
\`\`\`json
{
  "original_prompt": "{{original_prompt}}",
  "trade_history": {{trade_history}},
  "support_resistance_zones": {{support_resistance_zones}},
  "price_action_bars": {{price_action_bars}}
}
\`\`\`
Your task is to perform a critical analysis and then generate an improved prompt.

1. Performance Analysis:

Winning Trades:

What were the common characteristics of the market data and your analysis in the profitable trades?
Did these trades align perfectly with the guidelines in the original prompt?
Were there any nuances in the data (e.g., specific candlestick patterns, volume surges at particular levels) that were critical to their success but not explicitly mentioned in the prompt?
Losing Trades:

Identify the primary reasons for the losses. Was it due to:
False signals: Price broke a key level but immediately reversed (a "fakeout").
Poor timing: The entry was valid, but the market context shifted.
Inadequate risk management: The stop-loss was too tight or the profit target was not reached.
Ignoring contradictory evidence: Were there warning signs in the data (e.g., divergence, weakening volume) that were overlooked?
Which guidelines in the original prompt might have been misinterpreted or insufficient in these losing scenarios?
"Hold" Suggestions:

Review the market data for the instances you suggested to "hold." In hindsight, were there missed opportunities?
If so, what specific conditions for a valid trade did you fail to recognize? What adjustments to the prompt could help in identifying these in the future?
Conversely, did your "hold" suggestions correctly avoid losing trades?
2. Prompt Improvement:

Based on your analysis, you must now rewrite the original prompt. Your new prompt should be more precise and incorporate the lessons learned from your past performance.

Refine Existing Rules:

Should the criteria for a "strong trend" be more specific? For example, should it require alignment across more than two timeframes or a minimum slope on the VWAP?
Can the rules for identifying key level breaks/rejections be improved? For instance, should a breakout be confirmed by a certain number of closes above the level, or a specific percentage increase in volume?
Add New Rules:

Based on your analysis of winning and losing trades, introduce new guidelines. For example:
If you identified that winning trades often occurred after a specific candlestick pattern at a key level, add a guideline to look for that pattern.
If losing trades were common during low-volume periods, add a rule to avoid trading when volume is below a certain moving average.
Consider adding a rule about the time of day, if you notice that trades at certain times are consistently less successful.
Improve Clarity:

Make the language as unambiguous as possible to reduce the chance of misinterpretation.
Structure the prompt for optimal decision-making, perhaps by prioritizing the most important conditions.
Your final output should be the new, improved prompt in its entirety.
Make sure to include all placeholders from the original prompt.
`;
