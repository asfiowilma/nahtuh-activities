import React, { useEffect, useState } from 'react'
import { useScore } from '../contexts/ScoreContext'
import { flat, mod } from '../utils'
import { ReactSortable } from 'react-sortablejs'
import { TiWarning } from 'react-icons/ti'
import { nahtuhClient as n } from 'nahtuh-client'
import { useIdentity } from '../contexts/IdentityContext'
import { useSound } from '../contexts/SoundContext'

export const GroupAssignment = ({ isEditing, setEditing }) => {
  const [groupCount, setGroupCount] = useState(2)
  const [members, setMembers] = useState([])
  const [assigned, setAssigned] = useState([])
  const {
      state: { myId, group: myGroup },
    } = useIdentity(),
    {
      state: { btnClick },
    } = useSound(),
    {
      state: { playerList, groupData },
      setGroupData,
      setGroupLeaderboard,
      setGroupStandings,
      updateStandings,
    } = useScore()

  useEffect(() => {
    return () => updateStandings()
  }, [])

  useEffect(() => {
    const sortableMembers = playerList.map((p) => ({
      id: p.participantId,
      name: p.participantName,
    }))
    const assignedPlayers = flat(groupData.map((group) => group.members.map((p) => p.id)))
    const unassignedPlayers = sortableMembers.filter((p) => !assignedPlayers.includes(p.id))
    console.log('unassigned players', unassignedPlayers)
    if (unassignedPlayers.length === 0) setEditing(false)
    else setEditing(true)
    setMembers(unassignedPlayers)
    setAssigned(assignedPlayers)
  }, [playerList])

  useEffect(() => {
    if (groupData.length === groupCount) return
    const data = Array.from({ length: groupCount }).map((_, i) => ({ name: `Group ${i + 1}`, members: [] }))
    setGroupData(data)
    setAssigned([])
    const sortableMembers = playerList.map((p) => ({
      id: p.participantId,
      name: p.participantName,
    }))
    setMembers(sortableMembers)
  }, [groupCount])

  useEffect(() => {
    const assignedPlayers = flat(groupData.map((group) => group.members.map((p) => p.participantId)))
    setAssigned(assignedPlayers)
    console.log('group data in groupAssignment', groupData)
  }, [groupData])

  const onGroupNameChange = (name, idx) => {
    const data = [...groupData]
    data[idx].name = name
    setGroupData(data)
  }

  const setGroupMembers = (newMembers, idx) => {
    const data = [...groupData]
    data[idx].members = newMembers
    setGroupData(data)
  }

  const resetAssignment = () => {
    btnClick.play()
    if (!isEditing) return

    const data = Array.from({ length: groupCount }).map((_, i) => ({ name: groupData[i].name, members: [] }))
    const sortableMembers = playerList.map((p) => ({
      id: p.participantId,
      name: p.participantName,
    }))
    setMembers(sortableMembers)
    setGroupData(data)
    setAssigned([])
  }

  const randomAssignment = () => {
    btnClick.play()
    if (!isEditing) return

    const players = playerList.map((p) => ({
      id: p.participantId,
      name: p.participantName,
    }))
    const data = Array.from({ length: groupCount }).map((_, i) => ({ name: groupData[i].name, members: [] }))
    const n = players.length
    for (let i = 0; i < n; i++) {
      var idx = Math.floor(Math.random() * players.length)
      data[mod(i, parseInt(groupCount))].members.push(players[idx])
      players.splice(idx, 1)
    }
    setMembers([])
    setGroupData(data)
  }

  const assignHandler = () => {
    btnClick.play()
    setEditing(false)
    for (const group of groupData) {
      for (const member of group.members) {
        if (member.id === myId) {
          if (myGroup === group.name) continue
          n.joinGroup(member.id, group.name)
        } else n.sendToUser(member.id, { payload: 'JOIN_GROUP', groupName: group.name })
      }
    }
    setGroupLeaderboard({})
    setGroupStandings([])
    n.broadcast({ payload: 'CURRENT_GROUP_STANDINGS', groupStandings: [] })
  }

  return (
    <div className="mt-4">
      <label htmlFor="time-limit" className="ml-6 mt-4 text-sm">
        Groups
      </label>
      <div className="flex gap-2 mt-2">
        <div className="btn btn-primary rounded-full px-6" onClick={randomAssignment}>
          Randomize
        </div>
        <div className="btn btn-ghost rounded-full px-6" onClick={resetAssignment}>
          Reset
        </div>
        <label className="input-group flex flex-1">
          <div
            className="tooltip tooltip-bottom tooltip-accent"
            data-tip="When changing the group count, your current group assignment will be lost."
          >
            <div className="bg-neutral rounded-l-full pl-6 pr-3 py-3 flex items-center">
              Groups <TiWarning className="ml-1 w-5 h-5" />
            </div>
          </div>
          <input
            type="number"
            placeholder="2"
            value={groupCount}
            onChange={(e) => setGroupCount(e.target.value)}
            min={2}
            max={8}
            className="input input-bordered rounded-l-none flex-1"
          />
        </label>
      </div>
      <div className="flex flex-wrap rounded-card overflow-hidden mt-3">
        {groupData.map((group, i) => (
          <div
            key={`group-${i + 1}`}
            className={`p-2 flex flex-wrap gap-2 flex-1 ${
              mod(i, 3) === 0 ? 'bg-neutral' : mod(i, 3) === 1 ? 'bg-base-300' : 'bg-base-300 bg-opacity-50'
            }`}
            style={i === groupCount - 1 && mod(i + 1, 2) !== 0 ? {} : { maxWidth: '50%' }}
          >
            <div className="input-group flex flex-none w-full">
              <div
                className={`rounded-l-full text-xs py-1 px-2 ${
                  !isEditing ? 'rounded-r-full bg-base-100 text-base-content' : 'bg-neutral-content text-neutral'
                }`}
              >
                Name
              </div>
              <input
                type="text"
                className={`input input-xs flex-1 rounded-l-none p-0 pl-2 ${!isEditing ? 'bg-transparent' : ''}`}
                value={group.name}
                onChange={(e) => onGroupNameChange(e.target.value, i)}
                readOnly={!isEditing}
                maxLength={12}
              />
            </div>

            <ReactSortable
              className="w-full flex flex-wrap gap-1 min-h-8"
              list={group.members}
              setList={(newMembers) => setGroupMembers(newMembers, i)}
              group="players"
            >
              {group.members.map((member) => (
                <div key={member.id} className="badge badge-accent shadow-lg cursor-pointer hover:bg-accent-focus">
                  {member.name}
                </div>
              ))}
            </ReactSortable>
          </div>
        ))}
      </div>

      <div className="rounded-card bg-neutral bg-opacity-50 mt-3 p-4 w-full">
        {members.length > 0 ? (
          <div className="text-sm mb-1">Drag and drop members to assign them into groups.</div>
        ) : isEditing ? (
          <div className="w-full btn btn-secondary rounded-full px-6 mx-auto" onClick={assignHandler}>
            Assign
          </div>
        ) : (
          <div
            className="w-full btn rounded-full px-6 mx-auto"
            onClick={() => {
              setEditing(true)
              btnClick.play()
            }}
          >
            Edit
          </div>
        )}
        <ReactSortable className="flex flex-wrap gap-1" list={members} setList={setMembers} group="players">
          {members
            .filter((p) => !assigned.includes(p.id))
            .map((player) => (
              <div key={player.id} className="badge badge-accent shadow-lg cursor-pointer hover:bg-accent-focus">
                {player.name}
              </div>
            ))}
        </ReactSortable>
      </div>
    </div>
  )
}
