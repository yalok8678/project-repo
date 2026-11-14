import test from 'node:test';
import assert from 'node:assert/strict';
test('workspace role capabilities are intentionally constrained',()=>{
  const canEdit = role => ['OWNER','ADMIN','EDITOR'].includes(role);
  const canComment = role => ['OWNER','ADMIN','EDITOR','COMMENTER'].includes(role);
  assert.equal(canEdit('VIEWER'),false);
  assert.equal(canComment('VIEWER'),false);
  assert.equal(canComment('COMMENTER'),true);
  assert.equal(canEdit('EDITOR'),true);
});
