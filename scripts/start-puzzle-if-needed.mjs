/** Compatibility helper for gameplay checks; start-screen checks exercise the gate directly. */
export async function startPuzzleIfNeeded(page,level){
 if(await page.locator('#puzzle-setup').isVisible()){
  if(level)await page.locator('#start-difficulty').selectOption(level);
  await page.getByRole('button',{name:'Start puzzle',exact:true}).click();
 }
}
